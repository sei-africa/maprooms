from app.dst_api.scripts.zarrclim import compute_some_climatogies

def main():
    compute_some_climatogies('mean-stdev')
    compute_some_climatogies('percentile')

if __name__ == '__main__':
    main()
