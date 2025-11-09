import { supabase } from './supabaseClient';
import type { Profile } from '../types';

export const authService = {
  async signUp(
    email: string, 
    password: string, 
    username: string,
    firstname: string,
    middlename: string,
    lastname: string,
    gender: string,
    birthdate: string,
    contactnumber: string,
    fulladdress: string,
    role: string
  ) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Prevent redirect issues
        data: {
          username: username,
        }
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned');
    }

    // Wait a bit to ensure the auth user is fully committed to the database
    // This helps avoid foreign key constraint violations
    // Supabase needs time to commit the user to auth.users table
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Prepare profile data
    const profileData = {
      id: authData.user.id,
      username: username,
      email: email, // Store email in profiles table for username lookup
      firstname: firstname,
      middlename: middlename,
      lastname: lastname,
      gender: gender || null,
      birthdate: birthdate || null,
      contactnumber: contactnumber,
      fulladdress: fulladdress,
      role: role,
    };

    // Retry logic to handle potential timing issues with foreign key constraint
    let profileError: any = null;
    let retries = 5;
    const baseDelay = 1000;
    
    while (retries > 0) {
      // Use upsert instead of insert to handle cases where profile might already exist
      const { error } = await supabase
        .from('profiles')
        .upsert([profileData], {
          onConflict: 'id'
        });

      if (!error) {
        // Success - profile created
        break;
      }

      profileError = error;
      
      // If it's a foreign key constraint error, wait and retry
      if (error.message?.includes('foreign key constraint') || error.code === '23503') {
        retries--;
        if (retries > 0) {
          // Exponential backoff: wait longer with each retry
          const delay = baseDelay * Math.pow(2, 5 - retries);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        // If it's a different error, don't retry
        break;
      }
    }

    if (profileError) {
      throw new Error(
        profileError.message || 
        'Failed to create user profile. Please try again or contact support.'
      );
    }

    return authData;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string, redirectUrl?: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl || `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEmailByUsername(username: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return data?.email || null;
  },

  async signInWithUsername(username: string, password: string) {
    // First, get the email associated with the username
    const email = await this.getEmailByUsername(username);
    
    if (!email) {
      throw new Error('Username not found');
    }

    // Then sign in with the email
    return this.signIn(email, password);
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
