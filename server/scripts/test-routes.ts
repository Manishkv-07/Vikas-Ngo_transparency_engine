import dotenv from 'dotenv';
dotenv.config();

async function testRoutes() {
  const baseUrl = 'http://localhost:3000';
  const routes = [
    '/api/healthz',
    '/api/dashboard/summary',
    '/api/expenses'
  ];

  console.log('Starting Route Health Check...');
  let allPassed = true;

  for (const route of routes) {
    try {
      const url = `${baseUrl}${route}`;
      const response = await fetch(url);
      console.log(`Route [GET] ${route} -> Status: ${response.status} ${response.statusText}`);
      if (response.status !== 200) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`Route [GET] ${route} -> Failed to connect:`, error);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('All routes responded with a 200 status code. Health Check PASSED!');
    process.exit(0);
  } else {
    console.error('Some routes failed the health check. Health Check FAILED!');
    process.exit(1);
  }
}

testRoutes();
