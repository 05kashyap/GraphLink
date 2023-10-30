from django.apps import AppConfig

class UsersConfig(AppConfig):
    #default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self): #used to take signals for creating user profile
        import users.signals
