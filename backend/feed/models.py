from django.contrib.auth.models import User
from django.db import models
from django.urls import reverse
from django.utils import timezone

from users.images import shrink_image


class Post(models.Model):
    '''A text post'''
    title = models.CharField(max_length=100)
    content = models.TextField()
    date_posted = models.DateTimeField(default=timezone.now)
    author = models.ForeignKey(User, on_delete=models.CASCADE)  # if user deleted, posts deleted
    image = models.ImageField(upload_to='post_pics', default='default.jpg')
    likes = models.IntegerField(default=0)  # denormalised like count, kept in sync by Like.save/delete

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return reverse("post-detail", kwargs={"pk": self.pk})

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        shrink_image(self.image)

    def refresh_like_count(self):
        Post.objects.filter(pk=self.pk).update(likes=self.post_likes.count())


class Comment(models.Model):
    '''Comments model'''
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    body = models.TextField()
    created_on = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.body


class LikeManager(models.Manager):
    '''manages user likes'''
    def total_likes_for_user_posts(self, user):
        return self.filter(post__author=user).count()


class Like(models.Model):
    '''likes'''
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='post_likes')
    post_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_posts')
    objects = LikeManager()

    class Meta:
        unique_together = ('user', 'post')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.post.refresh_like_count()

    def delete(self, *args, **kwargs):
        result = super().delete(*args, **kwargs)
        self.post.refresh_like_count()
        return result
