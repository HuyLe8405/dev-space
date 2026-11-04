import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';

describe('Next.js Route Middleware', () => {
  it('should redirect unauthenticated users from /settings to /login with redirect parameter', () => {
    const request = new NextRequest('http://localhost:3000/settings');
    const response = middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/login?redirect=%2Fsettings',
    );
  });

  it('should redirect unauthenticated users from /workspaces to /login with redirect parameter', () => {
    const request = new NextRequest('http://localhost:3000/workspaces/project-1');
    const response = middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe(
      'http://localhost:3000/login?redirect=%2Fworkspaces%2Fproject-1',
    );
  });

  it('should redirect authenticated users from /login to /workspaces', () => {
    const request = new NextRequest('http://localhost:3000/login', {
      headers: {
        cookie: 'access_token=valid_token',
      },
    });
    const response = middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/workspaces');
  });

  it('should redirect authenticated users from /register to /workspaces', () => {
    const request = new NextRequest('http://localhost:3000/register', {
      headers: {
        cookie: 'refresh_token=valid_refresh',
      },
    });
    const response = middleware(request);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost:3000/workspaces');
  });

  it('should allow public access to the home page', () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = middleware(request);

    // If next() is returned, location header is null
    expect(response?.headers.get('location')).toBeNull();
  });
});
