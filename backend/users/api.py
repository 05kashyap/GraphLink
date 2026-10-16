from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from feed.serializers import PostSerializer, annotate_posts
from feed.models import Post
from .forms import ProfileUpdateForm, UserRegisterForm, UserUpdateForm
from .models import Profile
from .serializers import MeSerializer, UserProfileSerializer, UserSummarySerializer


def form_errors(form):
    '''Flatten Django form errors into {field: [messages]} for the frontend'''
    return {field: [str(message) for message in messages] for field, messages in form.errors.items()}


def me_payload(request):
    if not request.user.is_authenticated:
        return {"user": None}
    return {"user": MeSerializer(request.user, context={"request": request}).data}


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def csrf(request):
    '''Sets the csrftoken cookie so the frontend can make unsafe requests'''
    return Response({"ok": True})


@api_view(["GET", "PATCH"])
@permission_classes([permissions.AllowAny])
def me(request):
    if request.method == "GET":
        return Response(me_payload(request))

    if not request.user.is_authenticated:
        return Response({"detail": "Log in to edit your profile."}, status=status.HTTP_403_FORBIDDEN)
    data = {
        "username": request.data.get("username", request.user.username),
        "email": request.data.get("email", request.user.email),
    }
    u_form = UserUpdateForm(data, instance=request.user)
    p_form = ProfileUpdateForm(data, request.FILES, instance=request.user.profile)
    if u_form.is_valid() and p_form.is_valid():
        u_form.save()
        if "image" in request.FILES:
            p_form.save()
        return Response(me_payload(request))
    return Response({**form_errors(u_form), **form_errors(p_form)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    user = authenticate(request, username=request.data.get("username", ""),
                        password=request.data.get("password", ""))
    if user is None:
        return Response({"detail": "That username and password don't match."},
                        status=status.HTTP_400_BAD_REQUEST)
    login(request, user)
    return Response(me_payload(request))


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def logout_view(request):
    logout(request)
    return Response({"user": None})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    form = UserRegisterForm(request.data)
    if not form.is_valid():
        return Response(form_errors(form), status=status.HTTP_400_BAD_REQUEST)
    user = form.save()
    login(request, user)
    return Response(me_payload(request), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset(request):
    form = PasswordResetForm({"email": request.data.get("email", "")})
    if form.is_valid():
        form.save(
            request=request,
            use_https=request.is_secure(),
            subject_template_name="users/password_reset_subject.txt",
            email_template_name="users/password_reset_email.txt",
        )
    # Always succeed so the endpoint doesn't reveal which emails are registered.
    return Response({"ok": True})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    try:
        uid = force_str(urlsafe_base64_decode(request.data.get("uid", "")))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is None or not default_token_generator.check_token(user, request.data.get("token", "")):
        return Response({"detail": "This reset link is invalid or has expired."},
                        status=status.HTTP_400_BAD_REQUEST)
    form = SetPasswordForm(user, {
        "new_password1": request.data.get("new_password1", ""),
        "new_password2": request.data.get("new_password2", ""),
    })
    if not form.is_valid():
        return Response(form_errors(form), status=status.HTTP_400_BAD_REQUEST)
    form.save()
    return Response({"ok": True})


class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = User.objects.select_related("profile").order_by("username")
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(username__icontains=search)
        return queryset


class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.select_related("profile")
    lookup_field = "username"


class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = get_object_or_404(User, username=self.kwargs["username"])
        return annotate_posts(Post.objects.filter(author=user), self.request).order_by("-date_posted")


class UserConnectionsView(generics.ListAPIView):
    '''Followers or following of a user, depending on the `relation` kwarg'''
    serializer_class = UserSummarySerializer
    permission_classes = [permissions.AllowAny]
    relation = "followers"

    def get_queryset(self):
        user = get_object_or_404(User.objects.select_related("profile"), username=self.kwargs["username"])
        related = getattr(user.profile, self.relation)
        return related.select_related("profile").order_by("username")


@api_view(["POST", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def follow(request, username):
    target = get_object_or_404(Profile.objects.select_related("user"), user__username=username)
    if target.user == request.user:
        return Response({"detail": "You can't follow yourself."}, status=status.HTTP_400_BAD_REQUEST)
    if request.method == "POST":
        Profile.objects.follow(request.user.profile, target)
    else:
        Profile.objects.unfollow(request.user.profile, target)
    return Response(UserProfileSerializer(target.user, context={"request": request}).data)
