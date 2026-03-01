import React from 'react'
import QuizSection from './QuizSection'

export default function QuizPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-black text-white">
          Test Your Knowledge 🧠
        </h1>
        <p className="text-brand-subtext mt-1">
          Master the SDGs through quizzes. The more accurate you are with fewer attempts, the more XP you earn!
        </p>
      </div>
      <QuizSection />
    </div>
  )
}
