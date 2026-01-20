import cloudinary
import cloudinary.uploader
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def configure_cloudinary():
    if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        return True
    return False

def is_cloudinary_configured():
    return bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)

async def upload_image_to_cloudinary(content: bytes, filename: str, folder: str = "picnutra/meals") -> str:
    if not is_cloudinary_configured():
        logger.warning("Cloudinary not configured, cannot upload")
        return None
    
    try:
        configure_cloudinary()
        
        result = cloudinary.uploader.upload(
            content,
            folder=folder,
            public_id=filename.rsplit('.', 1)[0],
            resource_type="image",
            overwrite=True,
            transformation=[
                {"width": 2048, "height": 2048, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        secure_url = result.get("secure_url")
        logger.info(f"Image uploaded to Cloudinary: {secure_url}")
        return secure_url
        
    except Exception as e:
        logger.error(f"Error uploading to Cloudinary: {e}")
        return None

async def delete_image_from_cloudinary(public_id: str) -> bool:
    if not is_cloudinary_configured():
        return False
    
    try:
        configure_cloudinary()
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Error deleting from Cloudinary: {e}")
        return False

async def upload_image_from_url(image_url: str, filename: str, folder: str = "picnutra/generated") -> str:
    if not is_cloudinary_configured():
        logger.warning("Cloudinary not configured, returning original URL")
        return image_url
    
    try:
        configure_cloudinary()
        
        result = cloudinary.uploader.upload(
            image_url,
            folder=folder,
            public_id=filename,
            resource_type="image",
            overwrite=True,
            transformation=[
                {"width": 1024, "height": 1024, "crop": "limit"},
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        secure_url = result.get("secure_url")
        logger.info(f"Image from URL uploaded to Cloudinary: {secure_url}")
        return secure_url
        
    except Exception as e:
        logger.error(f"Error uploading URL to Cloudinary: {e}")
        return image_url
