import firebase from "firebase/app"
import "firebase/auth"
import "firebase/firestore"
import React, { useEffect, useState } from "react"
import { Button, TextField } from "@material-ui/core"
import { createTheme, ThemeProvider } from "@material-ui/core/styles"
import styles from "./styles.module.css"

const theme = createTheme({
  palette: {
    primary: {
      main: "#9370DB",
    },
    secondary: {
      main: "#11cb5f",
    },
  },
})

interface IEntryDiary {
  date: string
  text: string
  trash: boolean
}

interface IRecordDiary {
  id: string
  date: string
  text: string
  trash: boolean
}

export const Home = (): JSX.Element => {
  const [loading, setLoading] = useState<boolean>(false)
  const [count, setCount] = useState<number>(0)
  const [displayName, setDisplayName] = useState<string>(null)
  const [email, setEmail] = useState<string>(null)
  const [diaryList, setDiaryList] = useState<IRecordDiary[]>([])

  useEffect(() => {
    if (firebase.apps.length != 0) return

    setLoading(true)
    const firebaseConfig = {
      apiKey: "AIzaSyAAa6TM3BHE45ze-hfPPbC5ZbnIswk6ah8",
      authDomain: "db-diary-ee778.firebaseapp.com",
      databaseURL: "https://db-diary-ee778-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "db-diary-ee778",
      storageBucket: "db-diary-ee778.appspot.com",
      messagingSenderId: "774708687419",
      appId: "1:774708687419:web:27ac01b6253bf44ebbe21e",
    }
    firebase.initializeApp(firebaseConfig)

    firebase.auth().onAuthStateChanged(async (user) => {
      setDisplayName(user?.displayName)
      setEmail(user?.email)
      setLoading(false)

      if (!user) {
        setDiaryList([])
        setLoading(false)
        return
      }

      firebase
        .app()
        .firestore()
        .collection("user")
        .doc(await firebase.app().auth().currentUser.uid)
        .collection("diary")
        .where("trash", "!=", true)
        .orderBy("trash")
        .orderBy("date", "desc")
        .onSnapshot(async (snapshot) => {
          const list: IRecordDiary[] = []
          for (const d of snapshot.docs) {
            const data = (await d.data()) as IEntryDiary
            const record: IRecordDiary = {
              id: d.id,
              text: data.text,
              date: data.date,
              trash: data.trash,
            }
            list.push(record)
          }
          setDiaryList(list)
          setLoading(false)
        })
    })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <h1>Home</h1>
      <Button style={{ backgroundColor: "#12824C", color: "#FFFFFF" }} variant="outlined">
        Default
      </Button>
      <Button variant="outlined" color="primary">
        Primary
      </Button>
      <Button variant="outlined" color="secondary">
        Secondary
      </Button>
      <Button variant="outlined" disabled>
        Disabled
      </Button>
      <Button variant="outlined" color="primary" href="#outlined-buttons">
        Link
      </Button>
      <span>{loading ? "loading" : "done"}</span>
      <span>
        {displayName}
        {email}
      </span>
      <Button variant="outlined" onClick={() => setCount(count + 1)}>
        Button {count}
      </Button>

      <Button
        variant="outlined"
        color="primary"
        onClick={async () => {
          const googleAuthProvider = new firebase.auth.GoogleAuthProvider()
          await firebase.app().auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
          await firebase.app().auth().signInWithRedirect(googleAuthProvider)
        }}
      >
        SignIn
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={async () => {
          await firebase.app().auth().signOut()
        }}
      >
        SignOut
      </Button>

      <Button
        variant="outlined"
        color="primary"
        onClick={async () => {
          const diaryEntry: IEntryDiary = {
            date: new Date().toISOString(),
            text: "",
            trash: false,
          }
          await firebase
            .app()
            .firestore()
            .collection("user")
            .doc(await firebase.app().auth().currentUser.uid)
            .collection("diary")
            .add(diaryEntry)
        }}
      >
        Create
      </Button>

      {diaryList.map((i) => (
        <div key={i.id} className={styles["record"]}>
          <TextField
            label={i.date}
            multiline
            rows={4}
            defaultValue={i.text}
            variant="outlined"
            className={styles["record-text"]}
          />
        </div>
      ))}
    </ThemeProvider>
  )
}
export default Home
