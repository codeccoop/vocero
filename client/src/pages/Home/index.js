import React from 'react';
import './style.scss';

import { useProject } from '../../store/project';

function HomePage() {
  const project = useProject()[0];

  // useEffect(() => {
  //   console.log(project);
  // }, [project]);

  return (
    <>
      <h1 className="home__title">{project.GH_REPO}</h1>
      <p className="home__welcome-message">Welcome to Vocero Editor</p>
    </>
  );
}

export default HomePage;
