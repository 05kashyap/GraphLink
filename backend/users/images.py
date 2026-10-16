from PIL import Image

DEFAULT_IMAGE = 'default.jpg'
MAX_SIZE = (300, 300)


def shrink_image(field):
    '''Downscale an uploaded image in place so it is at most 300x300.'''
    if not field or field.name == DEFAULT_IMAGE:
        return
    try:
        img = Image.open(field.path)
    except (FileNotFoundError, ValueError):
        return
    if img.height > MAX_SIZE[1] or img.width > MAX_SIZE[0]:
        img.thumbnail(MAX_SIZE)
        img.save(field.path)


def image_url(field):
    '''Public URL for an uploaded image, or None when it is the placeholder.'''
    if not field or field.name == DEFAULT_IMAGE:
        return None
    return field.url
