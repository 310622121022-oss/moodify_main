'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ArrowLeft, CheckCircle2, Sparkles, TrendingUp, Loader2, Heart, Activity, Gamepad2, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { HomeNavbar } from '@/components/home-navbar';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AppFooter } from '@/components/app-footer';
import { FAQSection } from '@/components/faq-section';
import { useAuth } from '@/lib/auth-context';
import { getGameRecommendations, type MoodType } from '@/lib/mood-service';

type TestType = 'panas' | 'phq9' | 'gad7' | null;

type Question = {
  id: string;
  question: string;
  scale?: 'phq9' | 'panas' | 'gad7';
};

type AssessmentResult = {
  totalScore: number;
  severity: string;
  interpretation: string;
  recommendations: string[];
};

type TestInfo = {
  inventor: string;
  reason: string;
  certifiedBy: string;
  details: string;
};

type TestOption = {
  id: TestType;
  title: string;
  description: string;
  icon: typeof Brain | typeof Heart | typeof Activity;
  gradient: string;
  duration: string;
  info: TestInfo;
};

export default function PsychometricAssessment() {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<TestType>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [userSession, setUserSession] = useState('');

  const testOptions: TestOption[] = [
    {
      id: 'panas',
      title: 'PANAS-SF',
      description: 'Confused? Get a clearer understanding of your current mental state',
      icon: Heart,
      gradient: 'from-pink-400 to-rose-500',
      duration: '2-3 minutes',
      info: {
        inventor: 'David Watson, Lee Anna Clark, & Auke Tellegen',
        reason: 'Measures positive and negative affect (emotional states) with a short-form version for quick assessments of mood and emotions',
        certifiedBy: 'Validated by multiple peer-reviewed studies; widely used in clinical and research settings',
        details: 'The PANAS-SF (Short Form) is a 20-item self-report measure that assesses two dimensions of emotional experience: Positive Affect (PA) and Negative Affect (NA). It provides a rapid snapshot of your current emotional state.'
      }
    },
    {
      id: 'phq9',
      title: 'PHQ-9',
      description: 'Identify the presence and severity of depressive symptoms',
      icon: Brain,
      gradient: 'from-[#3C1F71] to-[#5B3A8F]',
      duration: '2-3 minutes',
      info: {
        inventor: 'Developed by Robert L. Spitzer, Janet B.W. Williams, Kurt Kroenke, and colleagues',
        reason: 'A screening tool and severity measure for depression based on DSM-IV diagnostic criteria',
        certifiedBy: 'FDA cleared; extensively validated in clinical and primary care settings; recommended by mental health organizations',
        details: 'The PHQ-9 is a 9-item self-report instrument that scores each criterion as "0" (not at all) to "3" (nearly every day). It assesses the severity of depressive symptoms and has been validated across diverse populations.'
      }
    },
    {
      id: 'gad7',
      title: 'GAD-7',
      description: 'Check for signs of excessive worry or anxiety patterns',
      icon: Activity,
      gradient: 'from-blue-400 to-cyan-500',
      duration: '2-3 minutes',
      info: {
        inventor: 'Developed by Robert L. Spitzer, Kurt Kroenke, and colleagues',
        reason: 'A brief screening tool and severity measure for generalized anxiety disorder',
        certifiedBy: 'Validated across multiple studies; recommended by psychiatric and medical associations',
        details: 'The GAD-7 is a 7-item self-report measure that assesses the severity of anxiety symptoms. Each item scores from "0" (not at all) to "3" (nearly every day), providing a rapid assessment of generalized anxiety.'
      }
    },
  ];

  const getScaleOptions = (testType: TestType) => {
    if (testType === 'panas') {
      return [
        { value: 1, label: 'Very slightly or not at all' },
        { value: 2, label: 'A little' },
        { value: 3, label: 'Moderately' },
        { value: 4, label: 'Quite a bit' },
        { value: 5, label: 'Extremely' },
      ];
    }
    return [
      { value: 0, label: 'Not at all' },
      { value: 1, label: 'Several days' },
      { value: 2, label: 'More than half the days' },
      { value: 3, label: 'Nearly every day' },
    ];
  };

  const getQuestions = (testType: TestType): Question[] => {
    if (testType === 'panas') {
      return [
        { id: 'panas_1', question: 'Interested in what was happening around you?', scale: 'panas' },
        { id: 'panas_2', question: 'Distressed or emotionally upset?', scale: 'panas' },
        { id: 'panas_3', question: 'Excited or energized?', scale: 'panas' },
        { id: 'panas_4', question: 'Upset or bothered by things?', scale: 'panas' },
        { id: 'panas_5', question: 'Strong or capable?', scale: 'panas' },
        { id: 'panas_6', question: 'Guilty about something?', scale: 'panas' },
        { id: 'panas_7', question: 'Scared or afraid?', scale: 'panas' },
        { id: 'panas_8', question: 'Hostile, angry, or irritated toward others?', scale: 'panas' },
        { id: 'panas_9', question: 'Enthusiastic or motivated?', scale: 'panas' },
        { id: 'panas_10', question: 'Proud of yourself or your actions?', scale: 'panas' },
        { id: 'panas_11', question: 'Irritable or easily annoyed?', scale: 'panas' },
        { id: 'panas_12', question: 'Alert and attentive to your surroundings?', scale: 'panas' },
        { id: 'panas_13', question: 'Ashamed or embarrassed about yourself?', scale: 'panas' },
        { id: 'panas_14', question: 'Inspired or uplifted?', scale: 'panas' },
        { id: 'panas_15', question: 'Nervous or tense?', scale: 'panas' },
        { id: 'panas_16', question: 'Determined to accomplish tasks or goals?', scale: 'panas' },
        { id: 'panas_17', question: 'Attentive and focused?', scale: 'panas' },
        { id: 'panas_18', question: 'Jittery or restless?', scale: 'panas' },
        { id: 'panas_19', question: 'Active and full of energy?', scale: 'panas' },
        { id: 'panas_20', question: 'Afraid or anxious?', scale: 'panas' },
      ];
    } else if (testType === 'gad7') {
      return [
        { id: 'gad7_1', question: 'Feeling nervous, anxious, or on edge', scale: 'gad7' },
        { id: 'gad7_2', question: 'Not being able to stop or control worrying', scale: 'gad7' },
        { id: 'gad7_3', question: 'Worrying too much about different things', scale: 'gad7' },
        { id: 'gad7_4', question: 'Trouble relaxing', scale: 'gad7' },
        { id: 'gad7_5', question: 'Being so restless that it is hard to sit still', scale: 'gad7' },
        { id: 'gad7_6', question: 'Becoming easily annoyed or irritable', scale: 'gad7' },
        { id: 'gad7_7', question: 'Feeling afraid, as if something awful might happen', scale: 'gad7' },
      ];
    }
    return [
      { id: 'phq9_1', question: 'Little interest or pleasure in doing things', scale: 'phq9' },
      { id: 'phq9_2', question: 'Feeling down, depressed, or hopeless', scale: 'phq9' },
      { id: 'phq9_3', question: 'Trouble falling or staying asleep, or sleeping too much', scale: 'phq9' },
      { id: 'phq9_4', question: 'Feeling tired or having little energy', scale: 'phq9' },
      { id: 'phq9_5', question: 'Poor appetite or overeating', scale: 'phq9' },
      { id: 'phq9_6', question: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', scale: 'phq9' },
      { id: 'phq9_7', question: 'Trouble concentrating on things, such as reading the newspaper or watching television', scale: 'phq9' },
      { id: 'phq9_8', question: 'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', scale: 'phq9' },
      { id: 'phq9_9', question: 'Thoughts that you would be better off dead, or of hurting yourself in some way', scale: 'phq9' },
    ];
  };

  useEffect(() => {
    const session = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUserSession(session);
  }, []);

  const handleAnswer = (score: number) => {
    const newResponses = [...responses, score];
    setResponses(newResponses);

    const questions = getQuestions(selectedTest);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults(newResponses);
    }
  };

  const handleTestSelection = (testType: TestType) => {
    setSelectedTest(testType);
    setCurrentQuestion(0);
    setResponses([]);
    setResult(null);
  };

  const calculateResults = async (finalResponses: number[]) => {
    setIsAnalyzing(true);

    try {
      let assessmentResult: AssessmentResult;
      const questions = getQuestions(selectedTest);

      if (selectedTest === 'panas') {
        const positiveItems = [0, 2, 4, 8, 9, 11, 13, 15, 16, 18];
        const negativeItems = [1, 3, 5, 6, 7, 10, 12, 14, 17, 19];

        const positiveScore = positiveItems.reduce((sum, idx) => sum + finalResponses[idx], 0);
        const negativeScore = negativeItems.reduce((sum, idx) => sum + finalResponses[idx], 0);
        const totalScore = positiveScore - negativeScore + 50;

        let severity = '';
        let interpretation = '';
        let recommendations: string[] = [];

        if (totalScore >= 60) {
          severity = 'Highly Positive';
          interpretation = 'You are experiencing predominantly positive emotions with high energy and enthusiasm.';
          recommendations = [
            'Continue engaging in activities that bring you joy',
            'Share your positive energy with others',
            'Maintain your current self-care practices',
            'Consider journaling to capture what contributes to your well-being',
          ];
        } else if (totalScore >= 50) {
          severity = 'Balanced';
          interpretation = 'You have a balanced emotional state with a mix of positive and negative emotions.';
          recommendations = [
            'Continue with balanced wellness activities',
            'Practice mindfulness to stay present',
            'Engage in activities that boost positive emotions',
            'Maintain social connections',
          ];
        } else {
          severity = 'Negative Affect Dominant';
          interpretation = 'You are experiencing more negative emotions than positive ones currently.';
          recommendations = [
            'Try our wellness games to boost your mood',
            'Practice gratitude exercises daily',
            'Engage in physical activity to improve mood',
            'Consider talking to someone about your feelings',
            'Practice stress-reduction techniques',
          ];
        }

        assessmentResult = { totalScore, severity, interpretation, recommendations };
      } else if (selectedTest === 'gad7') {
        const totalScore = finalResponses.reduce((sum, score) => sum + score, 0);

        let severity = '';
        let interpretation = '';
        let recommendations: string[] = [];

        if (totalScore >= 0 && totalScore <= 4) {
          severity = 'Minimal anxiety';
          interpretation = 'You are experiencing minimal or no anxiety symptoms.';
          recommendations = [
            'Continue with your current wellness routines',
            'Maintain healthy stress management practices',
            'Keep up regular exercise and sleep habits',
            'Stay connected with supportive people',
          ];
        } else if (totalScore >= 5 && totalScore <= 9) {
          severity = 'Mild anxiety';
          interpretation = 'You are experiencing mild anxiety symptoms.';
          recommendations = [
            'Practice relaxation techniques like deep breathing',
            'Try our calm breath exercises',
            'Maintain regular physical activity',
            'Consider mindfulness meditation',
            'Limit caffeine intake',
          ];
        } else if (totalScore >= 10 && totalScore <= 14) {
          severity = 'Moderate anxiety';
          interpretation = 'You are experiencing moderate anxiety symptoms.';
          recommendations = [
            'Consider consulting with a mental health professional',
            'Practice anxiety-reduction techniques regularly',
            'Use our breathing exercises daily',
            'Maintain a consistent daily routine',
            'Consider cognitive behavioral therapy (CBT)',
          ];
        } else {
          severity = 'Severe anxiety';
          interpretation = 'You are experiencing severe anxiety symptoms.';
          recommendations = [
            'We recommend consulting with a mental health professional',
            'Contact your healthcare provider for treatment options',
            'Practice grounding techniques when anxious',
            'Reach out to trusted friends or family for support',
            'Consider therapy and/or medication under professional guidance',
          ];
        }

        assessmentResult = { totalScore, severity, interpretation, recommendations };
      } else {
        const totalScore = finalResponses.reduce((sum, score) => sum + score, 0);

        let severity = '';
        let interpretation = '';
        let recommendations: string[] = [];

        if (totalScore >= 0 && totalScore <= 4) {
          severity = 'Minimal depression';
          interpretation = 'You are experiencing minimal or no depression symptoms.';
          recommendations = [
            'Continue with your current wellness routines',
            'Practice regular self-care activities',
            'Maintain healthy sleep, diet, and exercise habits',
            'Stay connected with friends and family',
          ];
        } else if (totalScore >= 5 && totalScore <= 9) {
          severity = 'Mild depression';
          interpretation = 'You are experiencing mild depression symptoms.';
          recommendations = [
            'Consider incorporating mindfulness or meditation practices',
            'Engage in regular physical activity',
            'Try our wellness games to boost your mood',
            'Talk to someone you trust about how you are feeling',
            'Monitor your symptoms over the next few weeks',
          ];
        } else if (totalScore >= 10 && totalScore <= 14) {
          severity = 'Moderate depression';
          interpretation = 'You are experiencing moderate depression symptoms.';
          recommendations = [
            'Consider reaching out to a mental health professional',
            'Establish a daily routine with regular sleep and meal times',
            'Practice stress-reduction techniques regularly',
            'Avoid isolation - maintain social connections',
            'Consider professional counseling or therapy',
          ];
        } else if (totalScore >= 15 && totalScore <= 19) {
          severity = 'Moderately severe depression';
          interpretation = 'You are experiencing moderately severe depression symptoms.';
          recommendations = [
            'We strongly recommend consulting with a mental health professional',
            'Contact your healthcare provider to discuss treatment options',
            'Reach out to trusted friends or family for support',
            'Consider therapy and/or medication under professional guidance',
            'If you have thoughts of self-harm, please seek immediate help',
          ];
        } else {
          severity = 'Severe depression';
          interpretation = 'You are experiencing severe depression symptoms.';
          recommendations = [
            'Please contact a mental health professional immediately',
            'Speak with your doctor about treatment options as soon as possible',
            'Do not hesitate to reach out for emergency support if needed',
            'National Suicide Prevention Lifeline: 988',
            'Crisis Text Line: Text HOME to 741741',
          ];
        }

        assessmentResult = { totalScore, severity, interpretation, recommendations };
      }

      setResult(assessmentResult);

      const scaleOptions = getScaleOptions(selectedTest);
      await supabase.from('mood_assessments').insert({
        user_id: user?.id || null,
        user_session: userSession,
        test_type: selectedTest,
        responses: finalResponses.map((score, index) => ({
          question: questions[index].question,
          answer: selectedTest === 'panas' ? scaleOptions[score - 1]?.label : scaleOptions[score].label,
          score: score,
        })),
        mood_result: assessmentResult.severity,
        mood_score: assessmentResult.totalScore,
        recommendations: assessmentResult.recommendations,
      });
    } catch (error) {
      console.error('Error calculating results:', error);
      setResult({
        totalScore: 0,
        severity: 'Analysis Error',
        interpretation: 'Unable to complete analysis. Please try again.',
        recommendations: ['Please try taking the assessment again.'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAssessment = () => {
    setSelectedTest(null);
    setCurrentQuestion(0);
    setResponses([]);
    setResult(null);
    const session = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setUserSession(session);
  };

  const getTestTitle = () => {
    const test = testOptions.find(t => t.id === selectedTest);
    return test?.title || 'Assessment';
  };

  const getTestGradient = () => {
    const test = testOptions.find(t => t.id === selectedTest);
    return test?.gradient || 'from-[#3C1F71] to-[#5B3A8F]';
  };

  const getMaxScore = () => {
    if (selectedTest === 'panas') return 100;
    if (selectedTest === 'gad7') return 21;
    return 27;
  };

  const getSeverityColor = (score: number) => {
    if (score <= 4) return 'from-green-500 to-emerald-600';
    if (score <= 9) return 'from-blue-500 to-cyan-600';
    if (score <= 14) return 'from-yellow-500 to-orange-500';
    if (score <= 19) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
  };

  // Map assessment result + selected test to a MoodType used by getGameRecommendations
  const getMoodForRecommendations = (): MoodType => {
    if (!result) return 'happy';
    const score = result.totalScore;
    if (selectedTest === 'gad7') {
      if (score >= 10) return 'anxious';
      if (score >= 5) return 'anxious';
      return 'happy';
    }
    if (selectedTest === 'phq9') {
      if (score >= 10) return 'sad';
      if (score >= 5) return 'sad';
      return 'happy';
    }
    // PANAS: higher means more positive
    if (selectedTest === 'panas') {
      if (score >= 60) return 'happy';
      if (score >= 50) return 'bored';
      return 'stressed';
    }
    return 'happy';
  };

  const recommendedGames = useMemo(() => {
    const mood = getMoodForRecommendations();
    return getGameRecommendations(mood).slice(0, 3);
  }, [result, selectedTest]);

  type ConsultantSimple = { id: string; full_name?: string; booking_url?: string; picture_url?: string };
  const [consultantsList, setConsultantsList] = useState<ConsultantSimple[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchConsultants = async () => {
      try {
        const res = await fetch('/api/consultants', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!mounted) return;
        setConsultantsList((json?.consultants as ConsultantSimple[]) || []);
      } catch (e) {
        console.error('Error fetching consultants for recommendations:', e);
      }
    };
    fetchConsultants();
    return () => { mounted = false; };
  }, []);

  const displayConsultants = useMemo(() => {
    return consultantsList.filter(c => !!c.full_name && c.full_name.trim()).slice(0, 3);
  }, [consultantsList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E2DAF5] via-white to-[#E2DAF5]">
      <HomeNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        {selectedTest ? (
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTest(null)}
              className="bg-[#E2DAF5] hover:bg-[#3C1F71] text-[#3C1F71] hover:text-white transition-colors px-4 py-2 rounded-lg font-medium"
            >
              Back
            </Button>
          </div>
        ) : null}
        {!selectedTest && (
          <>
            <Card className="mb-8 border-2 border-[#3C1F71]/20">
              <CardHeader className="bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] text-white">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  Choose Your Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-[#3C1F71]/80 mb-4">
                  Select the assessment that best matches what you would like to evaluate. Each assessment is scientifically validated and provides personalized insights.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-0">
              <TooltipProvider>
                {testOptions.map((test) => {
                  const Icon = test.icon;
                  return (
                    <Card
                      key={test.id}
                      className="group relative border-2 border-[#3C1F71]/20 hover:border-[#3C1F71] hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-visible"
                    >
                      <div className={`h-2 bg-gradient-to-r ${test.gradient}`} />
                      {/* Info Icon - Top Right */}
                      <div className="absolute -top-3 -right-3 z-10">
                        {/* Mobile: click popover (tooltips are hover-based and unreliable on touch) */}
                        <div className="sm:hidden">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="p-2 rounded-full bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] hover:shadow-lg transition-all hover:scale-110 shadow-md"
                                aria-label="Assessment info"
                              >
                                <Info className="w-5 h-5 text-white" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              side="bottom"
                              sideOffset={8}
                              className="z-[9999] w-72 max-w-[calc(100vw-2rem)] bg-white border-2 border-[#3C1F71]/20 text-[#3C1F71] shadow-2xl p-3 rounded-lg"
                            >
                              <div className="space-y-2">
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-sm">Inventor</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.inventor}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-sm">Purpose</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.reason}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-sm">Certification</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.certifiedBy}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-sm">Details</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.details}</p>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Desktop+: hover tooltip */}
                        <div className="hidden sm:block">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="p-2 rounded-full bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] hover:shadow-lg transition-all hover:scale-110 shadow-md"
                                aria-label="Assessment info"
                              >
                                <Info className="w-5 h-5 text-white" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              sideOffset={8}
                              className="z-[9999] w-64 sm:w-72 md:w-80 bg-white border-2 border-[#3C1F71]/20 text-[#3C1F71] shadow-2xl p-2 sm:p-3 rounded-lg"
                            >
                              <div className="space-y-2">
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-xs sm:text-sm">Inventor</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.inventor}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-xs sm:text-sm">Purpose</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.reason}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-xs sm:text-sm">Certification</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.certifiedBy}</p>
                                </div>
                                <div>
                                  <p className="font-semibold text-[#3C1F71] text-xs sm:text-sm">Details</p>
                                  <p className="text-[#3C1F71]/80 text-xs leading-tight">{test.info.details}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${test.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-[#3C1F71] mb-2">{test.title}</h3>
                          <p className="text-[#3C1F71]/70 mb-3">{test.description}</p>
                          <div className="bg-[#E2DAF5]/50 rounded-lg p-2 mb-4 w-full">
                            <p className="text-xs font-semibold text-[#3C1F71] mb-1">Certified by</p>
                            <p className="text-xs text-[#3C1F71]/80">{test.info.certifiedBy}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#3C1F71]/60">
                            <Sparkles className="w-4 h-4" />
                            <span>{test.duration}</span>
                          </div>
                          <Button
                            className={`w-full mt-4 bg-gradient-to-r ${test.gradient} hover:opacity-90 transition-opacity cursor-pointer`}
                            onClick={() => handleTestSelection(test.id)}
                          >
                            Start {test.title}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TooltipProvider>
            </div>
          </>
        )}

        {selectedTest && !result && !isAnalyzing && (
          <>
            <Card className="mb-8 border-2 border-[#3C1F71]/20">
              <CardHeader className={`bg-gradient-to-r ${getTestGradient()} text-white`}>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  {getTestTitle()} {selectedTest === 'panas' ? 'Emotional State' : selectedTest === 'gad7' ? 'Anxiety Assessment' : 'Depression Screening'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-[#3C1F71]/80 mb-4">
                  {selectedTest === 'panas' && 'Rate the extent you have felt each emotion. This assessment measures your current positive and negative affect.'}
                  {selectedTest === 'gad7' && 'Please answer each question based on how often you have been bothered by the following problems over the last 2 weeks.'}
                  {selectedTest === 'phq9' && 'The PHQ-9 is a validated screening tool for depression. Please answer each question based on how often you have been bothered by the following problems over the last 2 weeks.'}
                </p>
                <div className="flex items-center gap-2 text-sm text-[#3C1F71]/60">
                  <Sparkles className="w-4 h-4" />
                  <span>{getQuestions(selectedTest).length} questions • 2-3 minutes • Confidential screening</span>
                </div>
              </CardContent>
            </Card>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#3C1F71]">
                  Question {currentQuestion + 1} of {getQuestions(selectedTest).length}
                </span>
                <span className="text-sm text-[#3C1F71]/60">
                  {Math.round(((currentQuestion + 1) / getQuestions(selectedTest).length) * 100)}% complete
                </span>
              </div>
              <div className="h-2 bg-[#E2DAF5] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getTestGradient()} transition-all duration-300`}
                  style={{ width: `${((currentQuestion + 1) / getQuestions(selectedTest).length) * 100}%` }}
                />
              </div>
            </div>

            <Card className="border-2 border-[#3C1F71]/20">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="mb-6">
                  <p className="text-sm text-[#3C1F71]/60 mb-2">
                    {selectedTest === 'panas' ? 'To what extent do you feel:' : 'Over the last 2 weeks, how often have you been bothered by:'}
                  </p>
                  <h2 className="text-2xl font-semibold text-[#3C1F71]">
                    {getQuestions(selectedTest)[currentQuestion].question}
                  </h2>
                </div>
                <div className="space-y-3 mb-6" key={currentQuestion}>
                  {getScaleOptions(selectedTest).map((option) => {
                    const isSelected = responses[currentQuestion] === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 text-[#3C1F71] font-medium group ${
                          isSelected
                            ? 'border-[#3C1F71] bg-[#3C1F71]/10'
                            : 'border-[#E2DAF5] hover:border-[#3C1F71] hover:bg-[#E2DAF5]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#3C1F71] bg-[#3C1F71]'
                              : 'border-[#3C1F71]/30 group-hover:border-[#3C1F71]'
                          }`}>
                            <span className={`text-xs font-bold ${
                              isSelected ? 'text-white' : 'text-[#3C1F71] group-hover:text-[#3C1F71]'
                            }`}>{option.value}</span>
                          </div>
                          {option.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="bg-[#E2DAF5] hover:bg-[#3C1F71] text-[#3C1F71] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium"
                >
                  Previous Question
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {isAnalyzing && (
          <Card className="border-2 border-[#3C1F71]/20">
            <CardContent className="p-16 text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#3C1F71] animate-spin" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#3C1F71] mb-2">
                Calculating Your Results...
              </h2>
              <p className="text-[#3C1F71]/60">
                Processing your {getTestTitle()} responses
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <>
            <Card className="mb-8 border-2 border-[#3C1F71]/20 overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${getSeverityColor(result.totalScore)}`} />
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#3C1F71] to-[#5B3A8F] text-white text-xl sm:text-2xl md:text-3xl font-bold mb-4">
                    {result.totalScore}
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3C1F71] mb-2">
                    {result.severity}
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-[#3C1F71]/60">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-lg">{getTestTitle()} Score: {result.totalScore}/{getMaxScore()}</span>
                  </div>
                </div>

                <div className="bg-[#E2DAF5]/30 rounded-lg p-4 mb-6">
                  <p className="text-[#3C1F71] text-center">
                    {result.interpretation}
                  </p>
                </div>

                <div className="relative h-4 bg-[#E2DAF5] rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getSeverityColor(result.totalScore)} transition-all duration-1000`}
                    style={{ width: `${(result.totalScore / getMaxScore()) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8 border-2 border-[#3C1F71]/20">
              <CardHeader className="bg-[#E2DAF5]">
                <CardTitle className="text-xl text-[#3C1F71] flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {((selectedTest === 'phq9' && result.totalScore >= 15) || (selectedTest === 'gad7' && result.totalScore >= 15)) && (
                  <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold text-sm">
                      Important: Your score indicates you may be experiencing significant {selectedTest === 'phq9' ? 'depression' : 'anxiety'} symptoms. Please consider reaching out to a mental health professional for support.
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {result.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3C1F71] mt-0.5 flex-shrink-0" />
                      <p className="text-[#3C1F71]/80">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-[#3C1F71]/20 hover:border-[#3C1F71] transition-colors">
                <CardContent className="p-8">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3C1F71] to-[#5B3A8F] flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[#3C1F71] mb-2 text-center">Try Wellness Games</h3>
                  <p className="text-sm text-[#3C1F71]/60 text-center mb-4">Boost your mood with our interactive games</p>

                  <ol className="space-y-4 text-left">
                    {recommendedGames.map((g, idx) => (
                      <li key={g.title} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <Link href={g.url} className="font-semibold text-[#3C1F71]" title={`Play ${g.title} - ${g.description}`}>
                              {idx + 1}. {g.title}
                            </Link>
                            <Link href={g.url} title={`Start playing ${g.title}`}>
                              <Button size="sm" className="px-3 py-1 bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] text-white hover:opacity-90 transition-opacity">
                                Play
                              </Button>
                            </Link>
                          </div>
                          <p className="text-sm text-[#3C1F71]/70 mt-2">{g.description}</p>
                          <p className="text-xs text-[#3C1F71]/50 mt-1">{g.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="border-2 border-[#3C1F71]/20 hover:border-[#3C1F71] transition-colors">
                <CardContent className="p-6">
                  {/** Show recommendations here as well, excluding help/mood-check sessions */}
                  <div className="mb-4">
                    <h4 className="text-base font-semibold text-[#3C1F71] mb-4 text-center">Connect with Excepts</h4>
                    <div className="space-y-3">
                      {displayConsultants.map((c, idx) => {
                        const url = c.booking_url && c.booking_url.trim() ? c.booking_url : `/consultants/${c.id}`;
                        const isExternal = !!(c.booking_url && c.booking_url.trim());
                        return (
                          <div key={c.id} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              {c.picture_url ? (
                                <img src={c.picture_url} alt={c.full_name || 'Consultant'} title={c.full_name || 'Consultant'} className="w-[6.25rem] h-[6.25rem] object-cover rounded-md flex-shrink-0" />
                              ) : (
                                <div className="w-[6.25rem] h-[6.25rem] bg-[#E2DAF5] rounded-md flex items-center justify-center text-lg text-[#3C1F71] flex-shrink-0">
                                  {c.full_name ? c.full_name.charAt(0).toUpperCase() : '?'}
                                </div>
                              )}
                              <div className="text-base text-[#3C1F71] truncate">{isExternal ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-[#3C1F71] truncate" title={`Visit ${c.full_name}'s profile`}>{c.full_name}</a>
                              ) : (
                                <Link href={url} className="font-medium text-[#3C1F71] truncate" title={`View ${c.full_name}'s profile`}>{c.full_name}</Link>
                              )}</div>
                            </div>
                            {isExternal ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" title={`Consult with ${c.full_name}`}>
                                <Button size="sm" className="h-10 px-4 py-2 bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] text-white hover:opacity-90 transition-opacity">Consult Now</Button>
                              </a>
                            ) : (
                              <Link href={url} title={`Consult with ${c.full_name}`}>
                                <Button size="sm" className="h-10 px-4 py-2 bg-gradient-to-r from-[#3C1F71] to-[#5B3A8F] text-white hover:opacity-90 transition-opacity">Consult Now</Button>
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={resetAssessment}
                      className="w-full sm:w-auto bg-gradient-to-r text-xs sm:text-sm md:text-base from-[#3C1F71] to-[#5B3A8F] hover:opacity-90 transition-opacity"
                    >
                      Take Assessment Again
                    </Button>
                    <p className="text-sm text-[#3C1F71]/60 mt-3">
                      Track your mood changes over time
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <FAQSection 
        title="Assessment FAQs" 
        page="Assessment" 
        schemaType="AssessmentPage"
        items={[
          {
            id: '1',
            question: 'What is the PANAS-SF assessment?',
            answer: 'The PANAS-SF (Positive and Negative Affect Schedule - Short Form) is a 20-item self-report measure that assesses your current emotional state by measuring positive affect (PA) and negative affect (NA). It provides a quick snapshot of your mood and emotions.'
          },
          {
            id: '2',
            question: 'What is the PHQ-9 assessment?',
            answer: 'The PHQ-9 (Patient Health Questionnaire-9) is a 9-item screening tool for depression based on DSM-IV diagnostic criteria. It measures the severity of depressive symptoms and is widely used in clinical and primary care settings.'
          },
          {
            id: '3',
            question: 'What is the GAD-7 assessment?',
            answer: 'The GAD-7 (Generalized Anxiety Disorder-7) is a 7-item self-report measure that assesses the severity of anxiety symptoms. It helps identify and measure the severity of generalized anxiety disorder.'
          },
          {
            id: '4',
            question: 'How long do the assessments take?',
            answer: 'Each assessment typically takes 2-3 minutes to complete. They are designed to be quick yet comprehensive, allowing you to get meaningful insights about your mental health state without taking too much of your time.'
          },
          {
            id: '5',
            question: 'Are these assessments scientifically validated?',
            answer: 'Yes, all three assessments are scientifically validated and widely used in clinical and research settings. PANAS-SF, PHQ-9, and GAD-7 have been validated across diverse populations and are recommended by mental health organizations.'
          },
          {
            id: '6',
            question: 'Can I retake the assessments?',
            answer: 'Absolutely! You can retake any assessment at any time. Taking assessments regularly helps you track your mood changes over time and see how your mental health is progressing.'
          }
        ]}
      />
      <AppFooter />
    </div>
  );
}
