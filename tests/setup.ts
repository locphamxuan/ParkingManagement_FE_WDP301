// Nạp matcher DOM (toBeInTheDocument, toHaveClass...) cho `expect` của Vitest.
// Bản '/vitest' augment kiểu Assertion của Vitest → có type mà không cần sửa tsconfig.
import '@testing-library/jest-dom/vitest';
