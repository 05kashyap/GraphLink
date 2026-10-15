from django.contrib.auth.models import User
from rest_framework import serializers

from feed.models import Like, Post
from .images import image_url


class UserSummarySerializer(serializers.ModelSerializer):
    '''Compact user representation used in lists, posts and comments'''
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "avatar"]

    def get_avatar(self, user):
        return image_url(user.profile.image)


class UserProfileSerializer(UserSummarySerializer):
    '''Full profile with counts and the viewer's relationship to the user'''
    post_count = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    likes_received = serializers.SerializerMethodField()
    is_me = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    follows_you = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = UserSummarySerializer.Meta.fields + [
            "date_joined", "post_count", "follower_count", "following_count",
            "likes_received", "is_me", "is_following", "follows_you",
        ]

    def _viewer(self):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return request.user
        return None

    def get_post_count(self, user):
        return Post.objects.filter(author=user).count()

    def get_follower_count(self, user):
        return user.profile.followers.count()

    def get_following_count(self, user):
        return user.profile.following.count()

    def get_likes_received(self, user):
        return Like.objects.total_likes_for_user_posts(user)

    def get_is_me(self, user):
        return self._viewer() == user

    def get_is_following(self, user):
        viewer = self._viewer()
        return bool(viewer) and user.profile.followers.filter(pk=viewer.pk).exists()

    def get_follows_you(self, user):
        viewer = self._viewer()
        return bool(viewer) and viewer.profile.followers.filter(pk=user.pk).exists()


class MeSerializer(UserProfileSerializer):
    class Meta(UserProfileSerializer.Meta):
        fields = UserProfileSerializer.Meta.fields + ["email"]
