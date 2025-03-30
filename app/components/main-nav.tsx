const handleLogout = () => {
  console.log("Logging out, clearing localStorage")
  localStorage.removeItem("authToken")
  localStorage.removeItem("currentUser")
  setLogoutDialogOpen(false)
  setUsername("")
  router.push("/") // Changed from /login to /
} 