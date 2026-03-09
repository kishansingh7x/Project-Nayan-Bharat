import tarfile
import os

model_dir = "ocunet-model"
output_file = "model.tar.gz"

# Explicitly only include the files we want - no stale tar.gz inside!
INCLUDE = {"code", "ocunetv4.pth"}

print(f"Creating clean {output_file} from {model_dir}...")
with tarfile.open(output_file, "w:gz") as tar:
    for item in os.listdir(model_dir):
        if item not in INCLUDE:
            print(f"  Skipping: {item}")
            continue
        item_path = os.path.join(model_dir, item)
        tar.add(item_path, arcname=item)
        print(f"  Added: {item}")

print("\nContents of archive:")
with tarfile.open(output_file, "r:gz") as tar:
    for name in tar.getnames():
        print(f"  {name}")

print("\nDone! Upload this model.tar.gz to S3.")
