from app.misc.scripts.soilgrids_tawc import download_gyga_af_tawc

def main():
    sep = ''.join(['-'] * 60)
    print(f'{sep}\n Downloading GYGA Africa Soil Information')
    download_gyga_af_tawc('agg_erzd')
    download_gyga_af_tawc('agg_30cm')

if __name__ == '__main__':
    main()
