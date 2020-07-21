from cwc.settings import STAGE

def stage(request):
    return {'stage': STAGE}
