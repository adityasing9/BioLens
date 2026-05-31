import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger("biolens_supabase_storage")

class SupabaseStorageService:
    def __init__(self):
        self.client: Client = None
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            try:
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            logger.warning("Supabase credentials not fully configured. Storage service might fail.")

    def upload_file(self, file_bytes: bytes, filename: str, content_type: str = None) -> str:
        """
        Uploads a file to Supabase Storage.
        Returns the path/key of the uploaded file inside the bucket.
        """
        if not self.client:
            raise ValueError("Supabase client is not initialized. Check credentials.")
        
        file_options = {}
        if content_type:
            file_options["content-type"] = content_type
            
        try:
            # Upload the file bytes to the bucket
            response = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
                path=filename,
                file=file_bytes,
                file_options=file_options
            )
            # Depending on supabase-py version, response could be a dict or object.
            # Normally it returns a dictionary with 'path' key or path string.
            logger.info(f"Successfully uploaded file {filename} to Supabase Storage bucket {settings.SUPABASE_STORAGE_BUCKET}")
            return filename
        except Exception as e:
            logger.error(f"Failed to upload file {filename} to Supabase Storage: {e}")
            raise e

    def download_file(self, file_path: str) -> bytes:
        """
        Downloads a file from Supabase Storage bucket.
        Returns the file bytes.
        """
        if not self.client:
            raise ValueError("Supabase client is not initialized. Check credentials.")
            
        try:
            response = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(file_path)
            return response
        except Exception as e:
            logger.error(f"Failed to download file {file_path} from Supabase Storage: {e}")
            raise e

    def delete_file(self, file_path: str):
        """
        Deletes a file from Supabase Storage bucket.
        """
        if not self.client:
            raise ValueError("Supabase client is not initialized. Check credentials.")
            
        try:
            self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).remove([file_path])
            logger.info(f"Successfully deleted file {file_path} from Supabase Storage")
        except Exception as e:
            logger.error(f"Failed to delete file {file_path} from Supabase Storage: {e}")
            raise e

    def get_public_url(self, file_path: str) -> str:
        """
        Returns the public URL for a file in the bucket.
        Note: The bucket must be public for this to work without authentication.
        """
        if not self.client:
            raise ValueError("Supabase client is not initialized. Check credentials.")
            
        try:
            url = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(file_path)
            return url
        except Exception as e:
            logger.error(f"Failed to get public URL for {file_path}: {e}")
            raise e

    def get_signed_url(self, file_path: str, expires_in_seconds: int = 3600) -> str:
        """
        Generates a signed URL for temporary access to a private file.
        """
        if not self.client:
            raise ValueError("Supabase client is not initialized. Check credentials.")
            
        try:
            # Some versions of supabase-py might return a dict, some a string or object.
            res = self.client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).create_signed_url(
                path=file_path,
                expires_in=expires_in_seconds
            )
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            elif hasattr(res, "signed_url"):
                return res.signed_url
            elif isinstance(res, dict) and "signed_url" in res:
                return res["signed_url"]
            return str(res)
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {file_path}: {e}")
            raise e

# Singleton instance
supabase_storage = SupabaseStorageService()
