# Rmax calculation
## Assign X1 and X2
import numpy as np

X1 = 0.745
X2 = 350
def Rmax_calc(ounces,tonnage):
    Rmax = X1 * (1-np.exp(-X2 * ounces / tonnage))
    return Rmax
# Recovery calculation
def recovery_calc(Rmax,Rcum,k,days):
    R = Rmax - Rcum - 1/(k*days+(1/(Rmax-Rcum)))
    return R

# month list index
def month_index(date,project_span):
    return (date.year-project_span[0].year)*12 + date.month -project_span[0].month