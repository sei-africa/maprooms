from app.misc.scripts.enso_update import *

def main():
    sep = ''.join(['-'] * 60)

    print(f'{sep}\n Updating NOAA CPC Oceanic Niño Index (ONI)')
    update_enso_oni_cpc('oni')

    print(f'{sep}\n Updating NOAA CPC Relative Oceanic Niño Index (RONI)')
    update_enso_oni_cpc('roni')

if __name__ == '__main__':
    main()
