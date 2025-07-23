import React from 'react';
import { BookOpen, CheckCircle, XCircle, AlertTriangle, Target, Lightbulb, Code, HelpCircle } from 'lucide-react';

interface XMLRendererProps {
  xmlContent: string;
}

interface ParsedXMLData {
  generalData?: {
    disciplineTitle?: string;
    topic?: string;
    subtopics?: string[];
    prerequisites?: string[];
  };
  exampleContext?: {
    problemDescription?: string;
    expectedOutcome?: string;
    supplementaryMaterial?: any[];
  };
  workedExamples?: {
    correctExample?: {
      reflection?: string;
      steps?: Array<{ number: string; description: string }>;
      tests?: Array<{ input: string; expectedOutput: string }>;
    };
    erroneousExample?: {
      reflection?: string;
      steps?: Array<{ number: string; description: string }>;
      errorIdentification?: {
        errorLine?: string;
        errorExplanation?: string;
        proposedFix?: string;
      };
      tests?: Array<{ input: string; expectedOutput: string }>;
    };
  };
  socraticResponse?: {
    initialQuestion?: string;
    guidingQuestions?: string[];
    reflectionPrompts?: string[];
  };
}

const parseXMLContent = (xmlContent: string): ParsedXMLData => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  const result: ParsedXMLData = {};
  
  // Parse GeneralData
  const generalData = xmlDoc.querySelector('GeneralData');
  if (generalData) {
    result.generalData = {
      disciplineTitle: generalData.querySelector('DisciplineTitle')?.textContent?.trim(),
      topic: generalData.querySelector('Topic')?.textContent?.trim(),
      subtopics: Array.from(generalData.querySelectorAll('Subtopic')).map(el => el.textContent?.trim()).filter(Boolean),
      prerequisites: Array.from(generalData.querySelectorAll('Prerequisite')).map(el => el.textContent?.trim()).filter(Boolean)
    };
  }
  
  // Parse ExampleContext
  const exampleContext = xmlDoc.querySelector('ExampleContext');
  if (exampleContext) {
    result.exampleContext = {
      problemDescription: exampleContext.querySelector('ProblemDescription')?.textContent?.trim(),
      expectedOutcome: exampleContext.querySelector('ExpectedOutcome')?.textContent?.trim(),
      supplementaryMaterial: Array.from(exampleContext.querySelectorAll('Resource')).map(el => ({
        type: el.getAttribute('type'),
        url: el.getAttribute('url'),
        content: el.textContent?.trim()
      }))
    };
  }
  
  // Parse WorkedExamples
  const workedExamples = xmlDoc.querySelector('WorkedExamples');
  if (workedExamples) {
    const correctExample = workedExamples.querySelector('CorrectExample');
    const erroneousExample = workedExamples.querySelector('ErroneousExample');
    
    result.workedExamples = {};
    
    if (correctExample) {
      result.workedExamples.correctExample = {
        reflection: correctExample.querySelector('Reflection')?.textContent?.trim(),
        steps: Array.from(correctExample.querySelectorAll('Step')).map(step => ({
          number: step.getAttribute('number') || '',
          description: step.querySelector('Description')?.textContent?.trim() || ''
        })),
        tests: Array.from(correctExample.querySelectorAll('TestCase')).map(test => ({
          input: test.querySelector('Input')?.textContent?.trim() || '',
          expectedOutput: test.querySelector('ExpectedOutput')?.textContent?.trim() || ''
        }))
      };
    }
    
    if (erroneousExample) {
      result.workedExamples.erroneousExample = {
        reflection: erroneousExample.querySelector('Reflection')?.textContent?.trim(),
        steps: Array.from(erroneousExample.querySelectorAll('Step')).map(step => ({
          number: step.getAttribute('number') || '',
          description: step.querySelector('Description')?.textContent?.trim() || ''
        })),
        tests: Array.from(erroneousExample.querySelectorAll('TestCase')).map(test => ({
          input: test.querySelector('Input')?.textContent?.trim() || '',
          expectedOutput: test.querySelector('ExpectedOutput')?.textContent?.trim() || ''
        }))
      };
      
      const errorId = erroneousExample.querySelector('ErrorIdentification');
      if (errorId) {
        result.workedExamples.erroneousExample.errorIdentification = {
          errorLine: errorId.querySelector('ErrorLine')?.textContent?.trim(),
          errorExplanation: errorId.querySelector('ErrorExplanation')?.textContent?.trim(),
          proposedFix: errorId.querySelector('ProposedFix')?.textContent?.trim()
        };
      }
    }
  }
  
  // Parse SocraticResponse
  const socraticResponse = xmlDoc.querySelector('socratic_response');
  if (socraticResponse) {
    result.socraticResponse = {
      initialQuestion: socraticResponse.querySelector('initial_question')?.textContent?.trim(),
      guidingQuestions: Array.from(socraticResponse.querySelectorAll('guiding_questions')).map(el => el.textContent?.trim()).filter(Boolean),
      reflectionPrompts: Array.from(socraticResponse.querySelectorAll('reflection_prompts')).map(el => el.textContent?.trim()).filter(Boolean)
    };
  }
  
  return result;
};

const TopicCard: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode }> = ({ title, children, icon }) => (
  <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      {icon && <div className="text-blue-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const StepCard: React.FC<{ step: { number: string; description: string }; isCorrect?: boolean }> = ({ step, isCorrect = true }) => (
  <div className={`border-l-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'} pl-4 py-3 mb-3 rounded-r-lg`}>
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
        {step.number}
      </div>
      <p className="text-gray-700 leading-relaxed">{step.description}</p>
    </div>
  </div>
);

const TestCaseCard: React.FC<{ test: { input: string; expectedOutput: string }; isCorrect?: boolean }> = ({ test, isCorrect = true }) => (
  <div className={`border rounded-lg p-3 mb-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
    <div className="space-y-2">
      <div>
        <span className="text-sm font-medium text-gray-600">Entrada:</span>
        <code className="block bg-gray-100 p-2 rounded text-sm mt-1">{test.input}</code>
      </div>
      <div>
        <span className="text-sm font-medium text-gray-600">Saída:</span>
        <code className="block bg-gray-100 p-2 rounded text-sm mt-1">{test.expectedOutput}</code>
      </div>
    </div>
  </div>
);

export const XMLRenderer: React.FC<XMLRendererProps> = ({ xmlContent }) => {
  const parsedData = parseXMLContent(xmlContent);
  
  // Se não conseguir fazer parse do XML, mostrar conteúdo original
  if (!parsedData.generalData && !parsedData.exampleContext && !parsedData.workedExamples && !parsedData.socraticResponse) {
    return (
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap text-gray-700 leading-relaxed">{xmlContent}</pre>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* General Data */}
      {parsedData.generalData && (
        <TopicCard title="Informações Gerais" icon={<BookOpen className="w-5 h-5" />}>
          <div className="space-y-3">
            {parsedData.generalData.disciplineTitle && (
              <div>
                <span className="text-sm font-medium text-gray-600">Disciplina:</span>
                <p className="text-gray-800">{parsedData.generalData.disciplineTitle}</p>
              </div>
            )}
            {parsedData.generalData.topic && (
              <div>
                <span className="text-sm font-medium text-gray-600">Tópico:</span>
                <p className="text-gray-800">{parsedData.generalData.topic}</p>
              </div>
            )}
            {parsedData.generalData.subtopics && parsedData.generalData.subtopics.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Subtópicos:</span>
                <ul className="list-disc list-inside text-gray-700 mt-1">
                  {parsedData.generalData.subtopics.map((subtopic, index) => (
                    <li key={index}>{subtopic}</li>
                  ))}
                </ul>
              </div>
            )}
            {parsedData.generalData.prerequisites && parsedData.generalData.prerequisites.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-600">Pré-requisitos:</span>
                <ul className="list-disc list-inside text-gray-700 mt-1">
                  {parsedData.generalData.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TopicCard>
      )}
      
      {/* Example Context */}
      {parsedData.exampleContext && (
        <TopicCard title="Contexto do Problema" icon={<Target className="w-5 h-5" />}>
          <div className="space-y-3">
            {parsedData.exampleContext.problemDescription && (
              <div>
                <span className="text-sm font-medium text-gray-600">Descrição do Problema:</span>
                <p className="text-gray-800 leading-relaxed">{parsedData.exampleContext.problemDescription}</p>
              </div>
            )}
            {parsedData.exampleContext.expectedOutcome && (
              <div>
                <span className="text-sm font-medium text-gray-600">Resultado Esperado:</span>
                <p className="text-gray-800 leading-relaxed">{parsedData.exampleContext.expectedOutcome}</p>
              </div>
            )}
          </div>
        </TopicCard>
      )}
      
      {/* Worked Examples */}
      {parsedData.workedExamples && (
        <div className="space-y-4">
          {/* Correct Example */}
          {parsedData.workedExamples.correctExample && (
            <TopicCard title="Exemplo Correto" icon={<CheckCircle className="w-5 h-5 text-green-600" />}>
              <div className="space-y-4">
                {parsedData.workedExamples.correctExample.reflection && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-1">Reflexão</h4>
                        <p className="text-blue-700 leading-relaxed">{parsedData.workedExamples.correctExample.reflection}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {parsedData.workedExamples.correctExample.steps && parsedData.workedExamples.correctExample.steps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Passos da Solução:</h4>
                    {parsedData.workedExamples.correctExample.steps.map((step, index) => (
                      <StepCard key={index} step={step} isCorrect={true} />
                    ))}
                  </div>
                )}
                
                {parsedData.workedExamples.correctExample.tests && parsedData.workedExamples.correctExample.tests.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Casos de Teste:</h4>
                    {parsedData.workedExamples.correctExample.tests.map((test, index) => (
                      <TestCaseCard key={index} test={test} isCorrect={true} />
                    ))}
                  </div>
                )}
              </div>
            </TopicCard>
          )}
          
          {/* Erroneous Example */}
          {parsedData.workedExamples.erroneousExample && (
            <TopicCard title="Exemplo com Erro (Para Aprendizado)" icon={<AlertTriangle className="w-5 h-5 text-red-600" />}>
              <div className="space-y-4">
                {parsedData.workedExamples.erroneousExample.reflection && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Reflexão sobre o Erro</h4>
                        <p className="text-red-700 leading-relaxed">{parsedData.workedExamples.erroneousExample.reflection}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {parsedData.workedExamples.erroneousExample.steps && parsedData.workedExamples.erroneousExample.steps.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Passos Incorretos:</h4>
                    {parsedData.workedExamples.erroneousExample.steps.map((step, index) => (
                      <StepCard key={index} step={step} isCorrect={false} />
                    ))}
                  </div>
                )}
                
                {parsedData.workedExamples.erroneousExample.errorIdentification && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5" />
                      Identificação do Erro
                    </h4>
                    <div className="space-y-3">
                      {parsedData.workedExamples.erroneousExample.errorIdentification.errorLine && (
                        <div>
                          <span className="text-sm font-medium text-yellow-700">Onde ocorre o erro:</span>
                          <code className="block bg-yellow-100 p-2 rounded text-sm mt-1">{parsedData.workedExamples.erroneousExample.errorIdentification.errorLine}</code>
                        </div>
                      )}
                      {parsedData.workedExamples.erroneousExample.errorIdentification.errorExplanation && (
                        <div>
                          <span className="text-sm font-medium text-yellow-700">Explicação:</span>
                          <p className="text-yellow-800 mt-1">{parsedData.workedExamples.erroneousExample.errorIdentification.errorExplanation}</p>
                        </div>
                      )}
                      {parsedData.workedExamples.erroneousExample.errorIdentification.proposedFix && (
                        <div>
                          <span className="text-sm font-medium text-yellow-700">Solução proposta:</span>
                          <p className="text-yellow-800 mt-1">{parsedData.workedExamples.erroneousExample.errorIdentification.proposedFix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {parsedData.workedExamples.erroneousExample.tests && parsedData.workedExamples.erroneousExample.tests.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Casos de Teste (Demonstrando o Erro):</h4>
                    {parsedData.workedExamples.erroneousExample.tests.map((test, index) => (
                      <TestCaseCard key={index} test={test} isCorrect={false} />
                    ))}
                  </div>
                )}
              </div>
            </TopicCard>
          )}
        </div>
      )}
      
      {/* Socratic Response */}
      {parsedData.socraticResponse && (
        <TopicCard title="Perguntas Socráticas" icon={<HelpCircle className="w-5 h-5" />}>
          <div className="space-y-4">
            {parsedData.socraticResponse.initialQuestion && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">Pergunta Inicial:</h4>
                <p className="text-purple-700 leading-relaxed">{parsedData.socraticResponse.initialQuestion}</p>
              </div>
            )}
            
            {parsedData.socraticResponse.guidingQuestions && parsedData.socraticResponse.guidingQuestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Perguntas Orientadoras:</h4>
                <div className="space-y-2">
                  {parsedData.socraticResponse.guidingQuestions.map((question, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {parsedData.socraticResponse.reflectionPrompts && parsedData.socraticResponse.reflectionPrompts.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Prompts de Reflexão:</h4>
                <div className="space-y-2">
                  {parsedData.socraticResponse.reflectionPrompts.map((prompt, index) => (
                    <div key={index} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-indigo-700 italic">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TopicCard>
      )}
    </div>
  );
}; 