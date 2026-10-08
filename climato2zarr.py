from app.dst_api.scripts.zarrclim import compute_some_climatogies

def main():
    compute_some_climatogies('mean-stdev', overwrite=False)
    compute_some_climatogies('percentile', overwrite=False)

if __name__ == '__main__':
    main()
