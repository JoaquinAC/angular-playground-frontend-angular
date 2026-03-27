import { HttpContextToken } from '@angular/common/http';
import { InterceptorsLabRequestContext } from '../models/interceptors-lab.models';

export const INTERCEPTORS_LAB_CONTEXT = new HttpContextToken<InterceptorsLabRequestContext>(
  () => ({
    enabled: false,
    operation: null,
    label: '',
    requiresAdmin: false,
    transformResponse: false,
  }),
);
