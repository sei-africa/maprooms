# from app.dst_api.scripts.spei_compute import get_spi_distribution_pars_sp
from app.dst_api.scripts.spei_wrapper import get_spei_distribution_pars
import time

def main():
    sep = ''.join(['-'] * 60)
    params_spi = {
        'dataset': 'MON',
        'variable': ['precip'],
        'analysis': 'spi',
        'distribution': 'gamma',
    }

    start_time0 = time.perf_counter()

    print(f'{sep}\n Computing SPI dekadal distribution parameters.')
    pars_dek = params_spi.copy()
    pars_dek['temporalRes'] = 'dekadal'
    pars_dek['timeScale'] = 1
    tmp = get_spei_distribution_pars(pars_dek)

    end_time0 = time.perf_counter()
    elapsed_time0 = end_time0 - start_time0
    print(f"Computation time: {elapsed_time0:.1f} seconds")
    start_time0 = time.perf_counter()

    print(f'{sep}\n Computing SPI monthly distribution parameters.')
    pars_mon = params_spi.copy()
    pars_mon['temporalRes'] = 'monthly'
    pars_mon['timeScale'] = 1
    tmp = get_spei_distribution_pars(pars_mon)

    end_time0 = time.perf_counter()
    elapsed_time0 = end_time0 - start_time0
    print(f"Computation time: {elapsed_time0:.1f} seconds")

    for k in range(2, 13):
        start_time0 = time.perf_counter()

        print(f'{sep}\n Computing SPI seasonal ({k}-months) distribution parameters.')
        pars_seas = params_spi.copy()
        pars_seas['temporalRes'] = 'seasonal'
        pars_seas['timeScale'] = k
        pars_seas['timeRes'] = 'monthly'
        tmp = get_spei_distribution_pars(pars_seas)

        end_time0 = time.perf_counter()
        elapsed_time0 = end_time0 - start_time0
        print(f"Computation time: {elapsed_time0:.1f} seconds")

    ##############
    params_spei = {
        'dataset': 'MON',
        'variable': ['precip', 'et0'],
        'analysis': 'spei',
        'distribution': 'llogistic',
    }

    start_time0 = time.perf_counter()

    print(f'{sep}\n Computing SPEI dekadal distribution parameters.')
    pars_dek = params_spei.copy()
    pars_dek['temporalRes'] = 'dekadal'
    pars_dek['timeScale'] = 1
    tmp = get_spei_distribution_pars(pars_dek)

    end_time0 = time.perf_counter()
    elapsed_time0 = end_time0 - start_time0
    print(f"Computation time: {elapsed_time0:.1f} seconds")
    start_time0 = time.perf_counter()

    print(f'{sep}\n Computing SPEI monthly distribution parameters.')
    pars_mon = params_spei.copy()
    pars_mon['temporalRes'] = 'monthly'
    pars_mon['timeScale'] = 1
    tmp = get_spei_distribution_pars(pars_mon)

    end_time0 = time.perf_counter()
    elapsed_time0 = end_time0 - start_time0
    print(f"Computation time: {elapsed_time0:.1f} seconds")

    for k in range(2, 13):
        start_time0 = time.perf_counter()

        print(f'{sep}\n Computing SPEI seasonal ({k}-months) distribution parameters.')
        pars_seas = params_spei.copy()
        pars_seas['temporalRes'] = 'seasonal'
        pars_seas['timeScale'] = k
        pars_seas['timeRes'] = 'monthly'
        tmp = get_spei_distribution_pars(pars_seas)

        end_time0 = time.perf_counter()
        elapsed_time0 = end_time0 - start_time0
        print(f"Computation time: {elapsed_time0:.1f} seconds")

if __name__ == '__main__':
    main()
