from app.misc.scripts.enso_update import *

def main():
    sep = ''.join(['-'] * 60)

    print(f'{sep}\n Updating NOAA CPC ENSO Probabilities and Strength Probabilities')
    update_enso_probabilities()

if __name__ == '__main__':
    main()
