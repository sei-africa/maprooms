from app.misc.scripts.enso_update import *

def main():
    sep = ''.join(['-'] * 60)

    print(f'{sep}\n Updating NOAA CPC Weekly OISST.v2.1')
    update_enso_oisstv21_cpc('weekly')

if __name__ == '__main__':
    main()
