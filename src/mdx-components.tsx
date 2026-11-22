import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { MotionPlayer } from '@/components/motion/MotionPlayer';
import { LessonHeader, QuizBox } from '@/components/docs/shared/LessonWidgets';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    MotionPlayer,
    LessonHeader,
    QuizBox,
    ...components,
  };
}
