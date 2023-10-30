from django import template

register = template.Library()

@register.filter
def calculate_total_likes(posts):
    total_likes = 0
    for post in posts:
        total_likes += post.likes.count()
    return total_likes
