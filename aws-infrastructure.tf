terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1" # Mumbai Region
}

# -------------------------------------------------------------------
# 1. Authentication (Cognito)
# -------------------------------------------------------------------
resource "aws_cognito_user_pool" "asha_workers_pool" {
  name = "nayan_bharat_asha_workers"
  
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  mfa_configuration = "OPTIONAL"

  # FIX: Required configuration for Optional MFA
  software_token_mfa_configuration {
    enabled = true
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name                = "nayan_bharat_app_client"
  user_pool_id        = aws_cognito_user_pool.asha_workers_pool.id
  generate_secret     = false
  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

# -------------------------------------------------------------------
# 2. Database (RDS & DynamoDB)
# -------------------------------------------------------------------
resource "aws_db_instance" "patient_db" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15" # FIX: Major version only for better compatibility
  instance_class       = "db.t3.micro"
  username             = "admin_nayan"
  password             = "SecureStr0ngPass!" 
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  publicly_accessible  = false
}

resource "aws_dynamodb_table" "session_cache" {
  name         = "NayanBharatSessionCache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "SessionId"

  attribute {
    name = "SessionId"
    type = "S"
  }
}

# -------------------------------------------------------------------
# 3. Storage (S3 + KMS)
# -------------------------------------------------------------------
resource "aws_kms_key" "s3_key" {
  description             = "KMS key for encrypting fundus images"
  deletion_window_in_days = 10
}

resource "aws_s3_bucket" "fundus_images_bucket" {
  bucket = "nayan-bharat-fundus-images"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "s3_encryption" {
  bucket = aws_s3_bucket.fundus_images_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# -------------------------------------------------------------------
# 4. Compute (Lambda Functions)
# -------------------------------------------------------------------
resource "aws_iam_role" "lambda_exec_role" {
  name = "nayan_bharat_lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = [
          "lambda.amazonaws.com",
          "sagemaker.amazonaws.com"
        ]
      }
    }]
  })
}

# Policy to allow Lambda to talk to SageMaker OcuNet v4 brain
resource "aws_iam_role_policy" "lambda_sagemaker_policy" {
  name = "nayan_lambda_sagemaker_policy"
  role = aws_iam_role.lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action   = "sagemaker:InvokeEndpoint"
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# Policy to allow SageMaker to read model artifacts from S3 and decrypt KMS
resource "aws_iam_role_policy" "sagemaker_s3_policy" {
  name = "nayan_sagemaker_s3_policy"
  role = aws_iam_role.lambda_exec_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.fundus_images_bucket.arn,
          "${aws_s3_bucket.fundus_images_bucket.arn}/*"
        ]
      },
      {
        Action   = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Effect   = "Allow"
        Resource = aws_kms_key.s3_key.arn
      }
    ]
  })
}

# Attach AmazonSageMakerFullAccess managed policy
resource "aws_iam_role_policy_attachment" "sagemaker_full_access" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
}

resource "aws_lambda_function" "referral_manager" {
  filename      = "dummy_payload.zip" 
  function_name = "ReferralManager"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
}

resource "aws_lambda_function" "screening_processor" {
  filename         = "screening_lambda.zip"
  source_code_hash = filebase64sha256("screening_lambda.zip")
  function_name    = "ScreeningProcessor"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "screening_lambda.lambda_handler"
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SAGEMAKER_ENDPOINT = aws_sagemaker_endpoint.ocunet_endpoint.name
    }
  }
}

resource "aws_lambda_function" "data_sync_handler" {
  filename      = "dummy_payload.zip" 
  function_name = "DataSyncHandler"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
}

# -------------------------------------------------------------------
# 5. API Management (API Gateway)
# -------------------------------------------------------------------
resource "aws_apigatewayv2_api" "backend_api" {
  name          = "nayan-bharat-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.backend_api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "sync_integration" {
  api_id           = aws_apigatewayv2_api.backend_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.data_sync_handler.invoke_arn
}

resource "aws_apigatewayv2_route" "sync_route" {
  api_id    = aws_apigatewayv2_api.backend_api.id
  route_key = "POST /sync"
  target    = "integrations/${aws_apigatewayv2_integration.sync_integration.id}"
}

# Screening endpoint - connects to real SageMaker inference
resource "aws_apigatewayv2_integration" "screen_integration" {
  api_id           = aws_apigatewayv2_api.backend_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.screening_processor.invoke_arn
}

resource "aws_apigatewayv2_route" "screen_route" {
  api_id    = aws_apigatewayv2_api.backend_api.id
  route_key = "POST /screen"
  target    = "integrations/${aws_apigatewayv2_integration.screen_integration.id}"
}

# Allow API Gateway to invoke the screening Lambda
resource "aws_lambda_permission" "apigw_screen" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.screening_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.backend_api.execution_arn}/*/*/screen"
}

# Output the API URL
output "api_gateway_url" {
  value = aws_apigatewayv2_api.backend_api.api_endpoint
}

# -------------------------------------------------------------------
# 6. Notifications (SNS)
# -------------------------------------------------------------------
resource "aws_sns_topic" "high_risk_alerts" {
  name = "nayan-bharat-high-risk-alerts"
}

# -------------------------------------------------------------------
# 7. AI/ML Cloud Pipeline (SageMaker OcuNet v4)
# -------------------------------------------------------------------

# 1. Define the SageMaker Model
resource "aws_sagemaker_model" "ocunet_model" {
  name               = "ocunet-v4-model-v8"
  execution_role_arn = aws_iam_role.lambda_exec_role.arn

  primary_container {
    image          = "763104351884.dkr.ecr.ap-south-1.amazonaws.com/pytorch-inference:2.0.0-cpu-py310"
    model_data_url = "s3://${aws_s3_bucket.fundus_images_bucket.bucket}/model.tar.gz"
  }
}

# 2. Create the Endpoint Configuration
resource "aws_sagemaker_endpoint_configuration" "ocunet_config" {
  name = "ocunet-v4-config-v8"

  production_variants {
    variant_name           = "AllTraffic"
    model_name             = aws_sagemaker_model.ocunet_model.name
    initial_instance_count = 1
    instance_type          = "ml.t2.medium" 
  }
}

# 3. Deploy the Live SageMaker Endpoint
resource "aws_sagemaker_endpoint" "ocunet_endpoint" {
  name                 = "ocunet-v4-endpoint-v8"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.ocunet_config.name
}

# 4. Output the Endpoint Name
output "sagemaker_endpoint_name" {
  value = aws_sagemaker_endpoint.ocunet_endpoint.name
}

# -------------------------------------------------------------------
# 8. Static Website Hosting (S3 + CloudFront)
# -------------------------------------------------------------------

# S3 bucket for the static frontend
resource "aws_s3_bucket" "website_bucket" {
  bucket = "nayan-bharat-website"
}

resource "aws_s3_bucket_public_access_block" "website_public_access" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

# Upload frontend files to S3
resource "aws_s3_object" "index_html" {
  bucket       = aws_s3_bucket.website_bucket.id
  key          = "index.html"
  source       = "index.html"
  content_type = "text/html"
  etag         = filemd5("index.html")
}

resource "aws_s3_object" "style_css" {
  bucket       = aws_s3_bucket.website_bucket.id
  key          = "style.css"
  source       = "style.css"
  content_type = "text/css"
  etag         = filemd5("style.css")
}

resource "aws_s3_object" "app_js" {
  bucket       = aws_s3_bucket.website_bucket.id
  key          = "app.js"
  source       = "app.js"
  content_type = "application/javascript"
  etag         = filemd5("app.js")
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website_oac" {
  name                              = "nayan-bharat-oac"
  description                       = "OAC for Nayan Bharat website"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website_cdn" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "Nayan Bharat - ASHA Worker Portal"

  origin {
    domain_name              = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_id                = "S3-nayan-bharat-website"
    origin_access_control_id = aws_cloudfront_origin_access_control.website_oac.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-nayan-bharat-website"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 3600
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "website_policy" {
  bucket = aws_s3_bucket.website_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontAccess"
      Effect    = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.website_bucket.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.website_cdn.arn
        }
      }
    }]
  })

  depends_on = [aws_s3_bucket_public_access_block.website_public_access]
}

# Output the CloudFront URL
output "website_url" {
  value = "https://${aws_cloudfront_distribution.website_cdn.domain_name}"
}
