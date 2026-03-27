export const useRegisterSW = () => ({ offlineReady: [false, jest.fn()], needRefresh: [false, jest.fn()], updateServiceWorker: jest.fn() });
