// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock UUID for predictable test values
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `test-uuid-${uuidCounter++}`),
}));

// Suppress React 18 warnings
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

// Suppress console errors for React 18 warnings
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('ReactDOM.render is no longer supported') || 
     args[0].includes('unmountComponentAtNode is deprecated') ||
     args[0].includes('ReactDOMTestUtils.act is deprecated') ||
     args[0].includes('`ReactDOMTestUtils.act` is deprecated in favor of `React.act`'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
