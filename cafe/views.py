from django.shortcuts import render, redirect
from django.contrib import messages
from .forms import FeedBackForm, MenuItemForm

def index(request):
    return render(request, 'index.html')

def About(request):
    return render(request, 'About.html')

# --------------------------
# Feedback View
# --------------------------
def FeedBack_view(request):
    if not request.user.is_authenticated:
        messages.info(request, "You must register or login first to submit feedback.")
        return redirect('register')  # Redirect to register page if not logged in

    if request.method == 'POST':
        form = FeedBackForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Feedback submitted successfully!")
            return redirect('FeedBack_success')  # Redirect after submission
    else:
        form = FeedBackForm()
    
    return render(request, 'FeedBack.html', {'form': form})

# --------------------------
# Menu View
# --------------------------
def Menu_view(request):
    if not request.user.is_authenticated:
        messages.info(request, "You must register or login first to order menu items.")
        return redirect('register')  # Redirect to register page if not logged in

    if request.method == 'POST':
        form = MenuItemForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Menu order submitted successfully!")
            return redirect('Menu_success')  # Redirect after submission
    else:
        form = MenuItemForm()
    
    return render(request, 'Menu.html', {'form': form})

# --------------------------
# Success Pages
# --------------------------
def FeedBack_success(request):
    return render(request, 'FeedBack_success.html')

def Menu_success(request):
    return render(request, 'Menu_success.html')
