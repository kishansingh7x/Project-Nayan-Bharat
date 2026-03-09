import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import io
import json

def model_fn(model_dir):
    # Setup EfficientNet-B3 for 30 retinal classes
    model = models.efficientnet_b3(weights=None)
    num_ftrs = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(num_ftrs, 30)
    
    # Load your ocunetv4.pth weights (optional for infra test)
    try:
        with open(os.path.join(model_dir, 'ocunetv4.pth'), 'rb') as f:
            model.load_state_dict(torch.load(f, map_location=torch.device('cpu')))
    except Exception as e:
        print(f"Warning: model weights not found or failed to load. Using untrained weights. {e}")
    
    model.eval()
    return model

def input_fn(request_body, request_content_type):
    if request_content_type == 'application/x-image':
        image = Image.open(io.BytesIO(request_body)).convert('RGB')
        # Resize to 384x384 as required by OcuNet v4
        preprocess = transforms.Compose([
            transforms.Resize((384, 384)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        return preprocess(image).unsqueeze(0)
    raise ValueError(f"Unsupported content type: {request_content_type}")

def predict_fn(input_data, model):
    with torch.no_grad():
        return model(input_data)

def output_fn(prediction, content_type):
    probs = torch.sigmoid(prediction).numpy().tolist()[0]
    return json.dumps({"probabilities": probs}), content_type