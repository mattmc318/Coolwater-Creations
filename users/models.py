# -*- coding: utf-8 -*-
from __future__ import unicode_literals

# import os
import re

from django.db import models

from django.contrib.auth.models import User, UserManager
from django.core.exceptions import ObjectDoesNotExist

EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$')

class PersonManager(UserManager):
    def login_register(self, request, action):
        errors = []

        """
        Validate user input
        """
        # checks if user is registering
        if action == 'register':
            if len(request.POST['first_name']) == 0:
                errors.append('Please enter your first name.')
            if len(request.POST['last_name']) == 0:
                errors.append('Please enter your last name.')
            if len(request.POST['email']) == 0:
                errors.append('Please enter your email.')
            elif not EMAIL_REGEX.match(request.POST['email']):
                errors.append('Please enter a valid email.')
            if len(request.POST['password']) < 8:
                errors.append(
                    'Please enter a password that contains at least 8 characters.')
            if request.POST['confirm_password'] != request.POST['password']:
                errors.append('Passwords must match.')
        # checks if user is logging in
        elif action == 'login':
            if not EMAIL_REGEX.match(request.POST['email']):
                errors.append('Please enter a valid email.')

        """
        Login/Register
        """
        if not errors:
            # checks if email exists in database and
            # stores any Person associated with it
            try:
                person_email = Person.objects.get(email=request.POST['email'])
            except ObjectDoesNotExist:
                person_email = None
            email_exists = person_email != None

            # checks if user is registering
            if action == 'register':
                # checks if registering user email already exists
                if email_exists:
                    errors.append(
                        'A user account with this email already exists.')
                    return (False, errors)
                # otherwise bcrypt password and create user
                person = Person.objects.create_user(
                    username=request.POST['email'],
                    email=request.POST['email'],
                    password=request.POST['password'],
                    first_name=request.POST['first_name'],
                    last_name=request.POST['last_name'],
                )
                return (True, person.id)
            elif action == 'login':
                # compares user password with posted password
                if email_exists:
                    correct_pw = person_email.check_password(
                        request.POST['password'])
                else:
                    correct_pw = False
                if not correct_pw or not email_exists:
                    errors.append(
                        'The email and password combination you entered does not exist in our database. Please try again.')
                    return (False, errors)
                # grabs user id to store in session in views
                if correct_pw:
                    return (True, person_email.id)
            else:
                errors.append('Invalid action.')
        return (False, errors)

class Person(User):
    objects = PersonManager()

    class Meta:
        proxy = True
        auto_created = True
