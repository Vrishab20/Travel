"""Security utilities."""
from urllib.parse import urlparse


def is_trusted_url(url: str) -> bool:
    """Validate that a URL is from a trusted source.
    
    Only allow HTTPS URLs or specific trusted domains.
    """
    if not url:
        return False

    try:
        parsed = urlparse(url)
        
        # Allow HTTPS from any domain
        if parsed.scheme == "https":
            return True
        
        # Allow example.com for testing
        if parsed.scheme == "http" and parsed.netloc.endswith("example.com"):
            return True
        
        return False
    except Exception:
        return False
