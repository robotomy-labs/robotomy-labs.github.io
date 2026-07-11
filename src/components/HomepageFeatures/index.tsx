import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'The Log',
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
    description: (
      <>
        Written for engineers and serious hobbyists working with G1 EDU or
        similar humanoid platforms — concrete, reproducible detail over
        generic writeups.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
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
