import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Toaster } from 'react-hot-toast';

import Home from '@/screens/home/index.tsx';
import Landing from '@/screens/landing/LandingPage.tsx';
import '@/index.css';

const paths = [
    {
        path: '/e-board',
        element: (
          <Home/>
        ),
    },
    {
      path: '/',
      element: (
        <Landing/>
      ),
    },
];

const BrowserRouter = createBrowserRouter(paths);

const App = () => {
    return (
    <MantineProvider>
      <RouterProvider router={BrowserRouter}/>
      <Toaster position="top-right" />
    </MantineProvider>
    
    )
};

export default App;
