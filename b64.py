import base64

with open('C:/Users/icich/.gemini/antigravity/scratch/wobbler_designer/dots_bg.jpg', 'rb') as f:
    b64_data = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode('utf-8')

with open('C:/Users/icich/.gemini/antigravity/scratch/wobbler_designer/dots_bg_b64.txt', 'w') as f:
    f.write(b64_data)

print(f"Done! Data URL length: {len(b64_data)}")
