import json
import base64
import boto3
import os

sagemaker_runtime = boto3.client('sagemaker-runtime')
ENDPOINT_NAME = os.environ.get('SAGEMAKER_ENDPOINT', 'ocunet-v4-endpoint-v8')

# OcuNet v4: 30 retinal disease classes
CLASS_NAMES = [
    "Normal", "Diabetic Retinopathy (Mild NPDR)", "Diabetic Retinopathy (Moderate NPDR)",
    "Diabetic Retinopathy (Severe NPDR)", "Diabetic Retinopathy (Proliferative DR)",
    "Cataract (Incipient)", "Cataract (Immature)", "Cataract (Mature)", "Cataract (Dense/Hypermature)",
    "Glaucoma (Suspect)", "Glaucoma (Early)", "Glaucoma (Moderate)", "Glaucoma (Advanced)",
    "Age-Related Macular Degeneration (Early)", "Age-Related Macular Degeneration (Intermediate)",
    "Age-Related Macular Degeneration (Advanced/Wet)", "Keratoconus (Mild)",
    "Keratoconus (Moderate)", "Keratoconus (Advanced)",
    "Hypertensive Retinopathy", "Retinal Vein Occlusion", "Retinal Artery Occlusion",
    "Macular Hole", "Epiretinal Membrane", "Central Serous Retinopathy",
    "Retinal Detachment", "Optic Neuritis", "Papilledema",
    "Retinitis Pigmentosa", "Pathological Myopia"
]

# Group indices for summary display
DR_INDICES = [1, 2, 3, 4]
CATARACT_INDICES = [5, 6, 7, 8]
GLAUCOMA_INDICES = [9, 10, 11, 12]
AMD_INDICES = [13, 14, 15]
KERATO_INDICES = [16, 17, 18]

def get_group_result(probs, indices, threshold=0.3):
    """Get the highest probability class within a disease group."""
    max_prob = 0.0
    max_class = ""
    for i in indices:
        if probs[i] > max_prob:
            max_prob = probs[i]
            max_class = CLASS_NAMES[i]
    return {"class": max_class, "probability": round(max_prob, 4), "detected": max_prob > threshold}

def determine_risk_level(probs):
    """Determine overall risk: normal, mild, or severe."""
    normal_prob = probs[0]
    
    # Check for severe conditions
    severe_indices = [3, 4, 8, 12, 15, 18, 25, 26, 27]
    severe_max = max(probs[i] for i in severe_indices)
    
    # Check for mild/moderate conditions
    mild_indices = [1, 2, 5, 6, 9, 10, 13, 14, 16, 17, 19, 20, 21, 22, 23, 24, 28, 29]
    mild_max = max(probs[i] for i in mild_indices)
    
    if severe_max > 0.4:
        return "severe"
    elif mild_max > 0.3:
        return "mild"
    elif normal_prob > 0.5:
        return "normal"
    elif mild_max > 0.2:
        return "mild"
    else:
        return "normal"

def lambda_handler(event, context):
    """Handle incoming screening requests from API Gateway."""
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
    
    # Handle CORS preflight
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        body = json.loads(event.get('body', '{}'))
        image_b64 = body.get('image', '')
        
        if not image_b64:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'No image provided. Send base64 image in "image" field.'})
            }
        
        # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]
        
        image_bytes = base64.b64decode(image_b64)
        
        # Call SageMaker endpoint
        response = sagemaker_runtime.invoke_endpoint(
            EndpointName=ENDPOINT_NAME,
            ContentType='application/x-image',
            Body=image_bytes
        )
        
        result = json.loads(response['Body'].read().decode())
        probs = result.get('probabilities', [0.0] * 30)
        
        # Determine results
        risk_level = determine_risk_level(probs)
        dr = get_group_result(probs, DR_INDICES)
        cataract = get_group_result(probs, CATARACT_INDICES)
        glaucoma = get_group_result(probs, GLAUCOMA_INDICES)
        amd = get_group_result(probs, AMD_INDICES)
        kerato = get_group_result(probs, KERATO_INDICES)
        
        # Overall confidence = highest probability across all classes
        confidence = round(max(probs) * 100, 1)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'risk_level': risk_level,
                'confidence': confidence,
                'dr': dr,
                'cataract': cataract,
                'glaucoma': glaucoma,
                'amd': amd,
                'keratoconus': kerato,
                'all_probabilities': [round(p, 4) for p in probs],
                'class_names': CLASS_NAMES
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Inference failed: {str(e)}'})
        }
