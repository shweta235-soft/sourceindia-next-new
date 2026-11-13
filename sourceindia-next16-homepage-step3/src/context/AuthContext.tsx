"use client";
import {createContext,useContext,useEffect,useState,type ReactNode,type Dispatch,type SetStateAction} from "react";
import {apiFetch} from "@/lib/api";
export type User = {fname?:string;lname?:string;file?:{file?:string};company_info?:{organization_name?:string};[key:string]:unknown};
type AuthState={isLoggedIn:boolean;user:User|null;loadingUser:boolean;login:(token:string)=>void;logout:()=>void;setUser:Dispatch<SetStateAction<User|null>>};
const Context=createContext<AuthState|null>(null);
export function AuthProvider({children}:{children:ReactNode}){
 const [isLoggedIn,setLoggedIn]=useState(false);const [user,setUser]=useState<User|null>(null);const [loadingUser,setLoadingUser]=useState(true);
 useEffect(()=>{setLoggedIn(Boolean(localStorage.getItem("user_token")));},[]);
 useEffect(()=>{const token=localStorage.getItem("user_token");if(!token){setUser(null);setLoadingUser(false);return;}let cancelled=false;setLoadingUser(true);
 apiFetch<{user:User}>("/signup/profile",{headers:{Authorization:`Bearer ${token}`}}).then(data=>{if(!cancelled)setUser(data.user)}).catch(err=>{console.error("Profile request failed",err);if(!cancelled&&String(err).includes("401")){localStorage.removeItem("user_token");setLoggedIn(false);setUser(null)}}).finally(()=>{if(!cancelled)setLoadingUser(false)});
 return()=>{cancelled=true};},[isLoggedIn]);
 const login=(token:string)=>{localStorage.setItem("user_token",token);setLoggedIn(true)};
 const logout=()=>{localStorage.removeItem("user_token");setLoggedIn(false);setUser(null)};
 return <Context.Provider value={{isLoggedIn,user,loadingUser,login,logout,setUser}}>{children}</Context.Provider>
}
export function useAuth(){const c=useContext(Context);if(!c)throw new Error("useAuth requires AuthProvider");return c}
