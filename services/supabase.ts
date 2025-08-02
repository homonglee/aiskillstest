
import type { TestResult } from '../types';

// This is a mock implementation of a Supabase client.
// It uses localStorage to persist data across browser sessions for a more realistic demo.

const RESULTS_KEY = 'aiskillstest_results';

const getStoredResults = (): TestResult[] => {
  try {
    const stored = localStorage.getItem(RESULTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse stored results:", error);
    return [];
  }
};

const setStoredResults = (results: TestResult[]): void => {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
  } catch (error) {
    console.error("Failed to store results:", error);
  }
};

// Simulate a database table with an in-memory array, initialized from localStorage.
let mockTestResults: TestResult[] = getStoredResults();

/**
 * Saves a new test result. Simulates an insert operation.
 * @param result - The TestResult object to save.
 * @returns A promise that resolves when the save is complete.
 */
export const saveTestResult = async (result: TestResult): Promise<{ error: null }> => {
  console.log("Simulating save to Supabase:", result);
  
  // To prevent duplicates if the user retakes the test rapidly.
  mockTestResults = mockTestResults.filter(r => r.id !== result.id);
  mockTestResults.push(result);
  
  setStoredResults(mockTestResults);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return { error: null }; // Simulate successful Supabase response
};

/**
 * Fetches all test results. Simulates a select operation.
 * @returns A promise that resolves with an array of all TestResult objects.
 */
export const getTestResults = async (): Promise<TestResult[]> => {
  console.log("Simulating fetch from Supabase.");
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a fresh copy from localStorage to ensure consistency.
  return getStoredResults();
};
