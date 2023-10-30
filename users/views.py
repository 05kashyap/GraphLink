from django.shortcuts import render, redirect # render pages, redirect to other pages
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages # for flash msgs
from django.contrib.auth.decorators import login_required
from .forms import UserRegisterForm, UserUpdateForm, ProfileUpdateForm


# Create your views here.
def register(request):
    '''User registration form'''
    if request.method == 'POST':
        form = UserRegisterForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created for {username} successfully!, you can login now')
            return redirect('login')
    
    else: 
        form = UserRegisterForm()
    return render(request, 'users/register.html', {'form': form})
# format of render: req, filepath of html, context dict.

#decorated makes login required for viewing page
@login_required
def profile(request):
    '''Edit profile'''
    if request.method == 'POST':
        u_form = UserUpdateForm(request.POST, instance=request.user)
        p_form = ProfileUpdateForm(request.POST, request.FILES, instance=request.user.profile)#instance = allows form to show users current name,etc in form

        if u_form.is_valid() and p_form.is_valid():
            u_form.save()
            p_form.save()
            messages.success(request, f'Your account has been updated')
            return redirect('profile')

    else: 
        u_form = UserUpdateForm(instance=request.user)
        p_form = ProfileUpdateForm(instance=request.user.profile)

    context = {
        'u_form': u_form,
        'p_form': p_form,
    }
    return render(request, 'users/profile.html', context)