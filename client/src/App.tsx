import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { Toaster } from 'react-hot-toast';

import Home from '@/screens/home/index.tsx';

import '@/index.css';

const paths = [
    {
        path: '/',
        element: (
          <Home/>
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
