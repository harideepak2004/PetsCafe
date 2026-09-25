from django.shortcuts import render,redirect
from django.contrib.auth.models import User,auth
from django.contrib import messages 

def login(request):
    if request.method=="POST":
        username=request.POST['username']
        password=request.POST['password']
        user=auth.authenticate(username=username,password=password)
        if user is not None:
            messages.success(request,"login success")
            auth.login(request,user)
            return redirect('/')
        else:
            messages.info(request,"invalid credentials")
            # redirect.login('login')
            return redirect('register')
            
    else:
        return render(request,"login.html")

def logout(request):
    auth.logout(request)
    return redirect('/')

def register(request):
    if request.method=="POST":
        first_name=request.POST['first_name']
        last_name=request.POST['last_name']
        username=request.POST['username']
        password1=request.POST['password1']
        password2=request.POST['password2']
        email=request.POST['email']
        
        if not all([first_name, last_name, username, email, password1, password2]):
            messages.error(request, "Please fill all the fields")
            return redirect('register')

        if password1==password2:
            if User.objects.filter(username=username).exists():
                messages.info(request,'Username already exists')
                return redirect('register')
            elif User.objects.filter(email=email).exists():
                messages.info(request,'Email id already exists')
                return redirect('register')
            else:
                user=User.objects.create_user(username=username,password=password1,email=email,first_name=first_name,last_name=last_name)
                user.save()
                print("user created")
                return redirect('login')
        else:
            messages.info(request,"password mismatches")
            return redirect('register')
        return redirect('/')
    else:
        return render(request,'register.html')
