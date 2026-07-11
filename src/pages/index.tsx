import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p className={styles.intro}>
          Real-world development notes from building on the Unitree G1 EDU —
          the pitfalls, the fixes, and the architecture behind an actual
          robot in the field. Written for engineers and serious hobbyists
          working the same stack: exact symptoms, exact root causes, exact
          fixes.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/log">
            Browse the Log
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/architecture">
            Read the Architecture
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Real-world engineering notes from building on the Unitree G1 EDU — pitfalls, fixes, and architecture, for engineers and serious hobbyists.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
