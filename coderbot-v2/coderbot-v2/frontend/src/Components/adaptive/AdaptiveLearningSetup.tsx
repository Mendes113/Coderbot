import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Brain, 
  Target, 
  Clock, 
  BookOpen, 
  Lightbulb,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Headphones,
  Hand,
  FileText,
  Zap,
  Trophy,
  Play
} from 'lucide-react';
import { pb } from '@/integrations/pocketbase/client';
import { toast } from "@/components/ui/sonner";
import { 
  assessLearningStyle, 
  createOrUpdateProfile, 
  createLearningPath,
  type LearningProfile 
} from "@/services/adaptive-learning-service";

interface AdaptiveLearningSetupProps {
  onComplete?: (profile: LearningProfile, pathId: string) => void;
  className?: string;
}

export const AdaptiveLearningSetup: React.FC<AdaptiveLearningSetupProps> = ({ 
  onComplete, 
  className = "" 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Learning Style Assessment State
  const [assessmentResponses, setAssessmentResponses] = useState<Record<string, string>>({});
  const [learningStyle, setLearningStyle] = useState<string>('');
  
  // Profile Setup State
  const [profile, setProfile] = useState({
    pace_preference: 'normal',
    preferred_difficulty: 'beginner' as const,
    learning_goals: [] as string[],
    interests: [] as string[]
  });
  
  // Learning Path State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState('');

  const userId = pb.authStore.model?.id;

  const steps = [
    { title: 'Learning Style Assessment', icon: <Brain className="h-5 w-5" /> },
    { title: 'Profile Setup', icon: <Target className="h-5 w-5" /> },
    { title: 'Learning Path', icon: <BookOpen className="h-5 w-5" /> },
    { title: 'Complete Setup', icon: <CheckCircle className="h-5 w-5" /> }
  ];

  const learningStyleQuestions = [
    {
      id: 'q1',
      question: 'When learning something new, I prefer to:',
      options: [
        { value: 'visual', label: 'See diagrams, charts, and visual representations', icon: <Eye className="h-4 w-4" /> },
        { value: 'auditory', label: 'Listen to explanations and discussions', icon: <Headphones className="h-4 w-4" /> },
        { value: 'kinesthetic', label: 'Try it hands-on with practical examples', icon: <Hand className="h-4 w-4" /> },
        { value: 'reading_writing', label: 'Read detailed notes and write summaries', icon: <FileText className="h-4 w-4" /> }
      ]
    },
    {
      id: 'q2',
      question: 'I remember information best when:',
      options: [
        { value: 'visual', label: 'I can visualize it with images or mind maps', icon: <Eye className="h-4 w-4" /> },
        { value: 'auditory', label: 'I hear it explained or discuss it with others', icon: <Headphones className="h-4 w-4" /> },
        { value: 'kinesthetic', label: 'I practice it repeatedly with my hands', icon: <Hand className="h-4 w-4" /> },
        { value: 'reading_writing', label: 'I write it down and review my notes', icon: <FileText className="h-4 w-4" /> }
      ]
    },
    {
      id: 'q3',
      question: 'When solving problems, I tend to:',
      options: [
        { value: 'visual', label: 'Draw diagrams or use visual tools', icon: <Eye className="h-4 w-4" /> },
        { value: 'auditory', label: 'Talk through the problem out loud', icon: <Headphones className="h-4 w-4" /> },
        { value: 'kinesthetic', label: 'Try different approaches through trial and error', icon: <Hand className="h-4 w-4" /> },
        { value: 'reading_writing', label: 'Research and read about similar solutions', icon: <FileText className="h-4 w-4" /> }
      ]
    },
    {
      id: 'q4',
      question: 'In a classroom setting, I learn best from:',
      options: [
        { value: 'visual', label: 'Presentations with slides and visual aids', icon: <Eye className="h-4 w-4" /> },
        { value: 'auditory', label: 'Lectures and group discussions', icon: <Headphones className="h-4 w-4" /> },
        { value: 'kinesthetic', label: 'Lab work and interactive exercises', icon: <Hand className="h-4 w-4" /> },
        { value: 'reading_writing', label: 'Reading materials and taking detailed notes', icon: <FileText className="h-4 w-4" /> }
      ]
    }
  ];

  const skillOptions = [
    'Python Programming',
    'JavaScript & Web Development',
    'Data Structures & Algorithms',
    'Machine Learning',
    'Database Management',
    'System Design',
    'DevOps & Cloud',
    'Cybersecurity',
    'Mobile Development',
    'UI/UX Design'
  ];

  const handleAssessmentResponse = (questionId: string, value: string) => {
    setAssessmentResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const calculateLearningStyle = () => {
    const responses = Object.values(assessmentResponses);
    const styleCounts = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading_writing: 0
    };

    responses.forEach(response => {
      styleCounts[response as keyof typeof styleCounts]++;
    });

    const dominantStyle = Object.entries(styleCounts).reduce((a, b) => 
      styleCounts[a[0] as keyof typeof styleCounts] > styleCounts[b[0] as keyof typeof styleCounts] ? a : b
    )[0];

    return dominantStyle;
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      // Learning Style Assessment
      if (Object.keys(assessmentResponses).length < learningStyleQuestions.length) {
        toast.error('Please answer all questions before proceeding');
        return;
      }
      
      const style = calculateLearningStyle();
      setLearningStyle(style);
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Profile Setup
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Learning Path
      if (selectedSkills.length === 0) {
        toast.error('Please select at least one skill to focus on');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Complete Setup
      await handleCompleteSetup();
    }
  };

  const handleCompleteSetup = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Create/update user profile
      const profileData = {
        user_id: userId,
        learning_style: learningStyle as 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing',
        pace_preference: profile.pace_preference,
        preferred_difficulty: profile.preferred_difficulty,
        learning_goals: [...profile.learning_goals, ...customGoals.split(',').filter(g => g.trim())]
      };

      await createOrUpdateProfile(profileData);

      // Create learning path
      const pathResult = await createLearningPath(
        userId, 
        selectedSkills, 
        profileData.learning_goals
      );

      toast.success('Adaptive learning setup completed!');
      
      if (onComplete) {
        onComplete(profileData as LearningProfile, pathResult.path_id);
      }

    } catch (error) {
      console.error('Error completing setup:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLearningStyleIcon = (style: string) => {
    switch (style) {
      case 'visual':
        return <Eye className="h-8 w-8 text-blue-500" />;
      case 'auditory':
        return <Headphones className="h-8 w-8 text-green-500" />;
      case 'kinesthetic':
        return <Hand className="h-8 w-8 text-orange-500" />;
      case 'reading_writing':
        return <FileText className="h-8 w-8 text-purple-500" />;
      default:
        return <Brain className="h-8 w-8 text-gray-500" />;
    }
  };

  const getLearningStyleDescription = (style: string) => {
    switch (style) {
      case 'visual':
        return 'You learn best through visual representations like diagrams, charts, and mind maps.';
      case 'auditory':
        return 'You prefer learning through listening, discussions, and verbal explanations.';
      case 'kinesthetic':
        return 'You learn most effectively through hands-on practice and physical interaction.';
      case 'reading_writing':
        return 'You excel at learning through reading texts and writing detailed notes.';
      default:
        return '';
    }
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-6 w-6 mr-2 text-yellow-500" />
            Adaptive Learning Setup
          </CardTitle>
          <CardDescription>
            Let's personalize your learning experience with AI-powered insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div 
                  key={index} 
                  className={`flex items-center space-x-2 ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {step.icon}
                  <span className="text-sm hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Style Assessment</CardTitle>
            <CardDescription>
              Answer these questions to help us understand how you learn best
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {learningStyleQuestions.map((question, questionIndex) => (
              <div key={question.id} className="space-y-4">
                <h3 className="font-semibold text-lg">
                  {questionIndex + 1}. {question.question}
                </h3>
                <RadioGroup
                  value={assessmentResponses[question.id] || ''}
                  onValueChange={(value) => handleAssessmentResponse(question.id, value)}
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      {option.icon}
                      <Label 
                        htmlFor={`${question.id}-${option.value}`} 
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Learning Style Result */}
          <Card>
            <CardHeader>
              <CardTitle>Your Learning Style</CardTitle>
              <CardDescription>Based on your assessment results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                {getLearningStyleIcon(learningStyle)}
                <div>
                  <h3 className="font-bold text-xl capitalize">{learningStyle.replace('_', ' ')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getLearningStyleDescription(learningStyle)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
              <CardDescription>Tell us more about your learning preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Learning Pace</Label>
                <RadioGroup
                  value={profile.pace_preference}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, pace_preference: value }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="slow" id="slow" />
                    <Label htmlFor="slow">Slow and thorough - I like to take my time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal">Normal pace - balanced approach</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fast" id="fast" />
                    <Label htmlFor="fast">Fast-paced - I like quick progress</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base font-semibold">Starting Difficulty Level</Label>
                <RadioGroup
                  value={profile.preferred_difficulty}
                  onValueChange={(value) => setProfile(prev => ({ 
                    ...prev, 
                    preferred_difficulty: value as 'beginner' | 'intermediate' | 'advanced' | 'expert'
                  }))}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner">Beginner - I'm new to programming</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate">Intermediate - I have some experience</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced">Advanced - I'm comfortable with complex topics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expert" id="expert" />
                    <Label htmlFor="expert">Expert - I want challenging content</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Learning Path</CardTitle>
            <CardDescription>
              Select the skills you want to focus on. We'll create a personalized learning path for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Select Skills to Focus On (choose 3-5 for best results)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {skillOptions.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox
                      id={skill}
                      checked={selectedSkills.includes(skill)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSkills(prev => [...prev, skill]);
                        } else {
                          setSelectedSkills(prev => prev.filter(s => s !== skill));
                        }
                      }}
                    />
                    <Label htmlFor={skill} className="text-sm cursor-pointer">
                      {skill}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-goals" className="text-base font-semibold">
                Additional Learning Goals (Optional)
              </Label>
              <Textarea
                id="custom-goals"
                placeholder="Enter any specific learning goals, separated by commas..."
                value={customGoals}
                onChange={(e) => setCustomGoals(e.target.value)}
                className="mt-2"
              />
            </div>

            {selectedSkills.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  Selected Skills:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              Setup Complete!
            </CardTitle>
            <CardDescription>
              Ready to start your personalized learning journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Your Learning Profile</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Learning Style:</span>
                    <Badge variant="secondary" className="capitalize">
                      {learningStyle.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pace:</span>
                    <Badge variant="outline" className="capitalize">
                      {profile.pace_preference}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Difficulty:</span>
                    <Badge variant="outline" className="capitalize">
                      {profile.preferred_difficulty}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Selected Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-center">
                <Play className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-semibold">Ready to Begin!</p>
                <p className="text-sm text-muted-foreground">
                  Your adaptive learning system is configured and ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? (
            'Setting up...'
          ) : currentStep === steps.length - 1 ? (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Start Learning
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 