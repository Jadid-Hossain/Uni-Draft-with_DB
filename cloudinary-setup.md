# Cloudinary Setup Guide

## ✅ Your Cloudinary Credentials
- **Cloud Name**: `dcyvcrdu2`
- **API Key**: `173529684339573`
- **API Secret**: `**********` (keep this secret!)

## 🔧 Required Setup

### 1. Create Upload Preset
- Go to your Cloudinary dashboard: https://console.cloudinary.com/
- Navigate to **Settings > Upload**
- Scroll down to **"Upload presets"**
- Click **"Add upload preset"**
- Set **"Signing Mode"** to **"Unsigned"** (this is crucial!)
- Give it a name (e.g., `profile_uploads`)
- Save the preset

### 2. Create Environment File
Create a `.env` file in your project root with:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=dcyvcrdu2
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name

# Example (replace with your actual preset name):
VITE_CLOUDINARY_CLOUD_NAME=dcyvcrdu2
VITE_CLOADINARY_UPLOAD_PRESET=profile_uploads
```

### 3. Important Security Notes
- ✅ **DO use**: Cloud Name + Upload Preset (for client-side uploads)
- ❌ **DON'T use**: API Key + API Secret (these should stay server-side only)
- The Upload Preset must be set to **"Unsigned"** mode

## 🚀 Features Now Available
- ✅ Profile picture uploads to Cloudinary
- ✅ Automatic image optimization
- ✅ Responsive image sizing (256x256 for profile)
- ✅ Secure cloud storage
- ✅ No server setup required

## 📱 How It Works
1. User selects image in Profile page
2. Image uploads directly to Cloudinary using your cloud name
3. Cloudinary returns a secure URL
4. URL is saved to your database
5. Images are automatically optimized when displayed

## 🔍 Testing
After setting up the `.env` file:
1. Restart your development server
2. Go to Profile page
3. Try uploading a profile picture
4. Check browser console for any errors
5. Verify the image appears and is optimized
