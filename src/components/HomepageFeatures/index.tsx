import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'The Log',
    icon: 'ti-bug',
    description: (
      <>
        Pitfall-style entries from real development sessions. Every entry
        follows the same shape: Symptom, Environment, Root Cause, Fix — exact
        errors, exact versions, exact commands.
      </>
    ),
  },
  {
    title: 'The Architecture',
    icon: 'ti-blueprint',
    description: (
      <>
        Living reference docs for the G1 EDU stack — CUDA, Jetson, DDS, the
        voice pipeline, gesture systems. Edited in place as the system
        changes, not dated posts.
      </>
    ),
  },
  {
    title: 'Built for the Stack',
    icon: 'ti-cpu',
    description: (
      <>
        Written for engineers and serious hobbyists working with G1 EDU or
        similar humanoid platforms — concrete, reproducible detail over
        generic writeups.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className="ro-card">
        <i className={clsx('ti', icon, 'ro-card__icon')} aria-hidden="true" />
        <Heading as="h3" className="ro-card__title">
          {title}
        </Heading>
        <p className="ro-card__description">{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
