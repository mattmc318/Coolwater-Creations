from cwc.settings import STAGE

def stage(request):
    return {'STAGE': STAGE}
