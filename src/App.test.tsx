import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the initial upload stage', () => {
    render(<App />);
    
    // 检查上传标题是否存在
    expect(screen.getByRole('heading', { name: /上传视频文件/i })).toBeInTheDocument();

    // 检查提示文本是否存在
    expect(screen.getByText(/拖拽视频到此处，或点击选择文件/i)).toBeInTheDocument();
  });
});
