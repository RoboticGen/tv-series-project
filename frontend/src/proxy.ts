import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  if (request.auth?.user) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }
});

export const config = {
  matcher: "/",
};
