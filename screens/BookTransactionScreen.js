import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import firebase from 'firebase'
import db from '../config'

export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedData:'',
            buttonState:'normal',
            scannedBookID:'',
            scannedStudentID:'',
            transactionMessage:'',
        }
    }

    getCameraPermission = async(id)=>{
        const {status} = await Permissions.askAsync(Permissions.CAMERA);
        this.setState({
            hasCameraPermissions: status==="granted",
            buttonState:id,
            scanned:false,
        })
    }

    handleBarCodeScanned = async({type, data})=>{

        const {buttonState}=this.state

        if(buttonState==="BookId"){
            this.setState({scanned:true, scannedBookID:data, buttonState:'normal'})
        }else if(buttonState==="StudentId"){
            this.setState({scanned:true, scannedStudentID:data, buttonState:'normal'})
        }
       
    }
    handleTransaction=async()=>{
         //Verify if the student is elligible for book issue or return or not
        //Student Id exists in the database
        //Issue: #Issued less then 2
        //Issue:Verify Book Availability
        // Return:Last Transaction=>Book Issued by the Student Id
        var transactionType = await this.checkBookEligibility();
        if(!transactionType){
            alert("The Book Doesn't exist in the library database");
            this.setState({
                scannedBookID:'',
                scannedStudentID:'',
            })
        } else if(transactionType==="Issue"){
            var isStudentEligible= await this.checkStudentEligibilityForBookIssue();
            if(isStudentEligible){
                this.initiateBookIssue();
                alert("Book Issued to the Student");
            }
        }else{
            var isStudentEligible=await this.checkStudentEligibilityForReturn();
            if(isStudentEligible){
                this.initiateBookReturn();
                alert("Book Returned to the Library");
            }
        }
        /*var transactionMessage;
        db.collection("books").doc(this.state.scannedBookID).get()
        .then((doc)=>{
            var book = doc.data()
            if(book.bookAvailability){
                this.initiateBookIssue();
                transactionMessage="book Issued"
                alert(transactionMessage)
            }else{
                this.initiateBookReturn();
                transactionMessage="book Returned"
                alert(transactionMessage)
            }
        })
        this.setState({
            transactionMessage:transactionMessage
        })*/
    }

    checkStudentEligibilityForBookIssue = async() => {
        const studentRef = await db.collection("students")
        .where("studentId", "==", this.state.scannedStudentID)
        .get()
        var isStudentEligible = ""
        if(studentRef.docs.length==0){
            this.setState({
                scannedStudentID:'',
                scannedBookID:'',
            })
            isStudentEligible=false;
            alert("The Student Id Doesn't Exist in the Database")
        } else{
            studentRef.docs.map((doc)=>{
                var student = doc.data();
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true;
                } else {
                    isStudentEligible=false;
                    alert("The Student has already Issued 2 Books")
                    this.setState({
                        scannedStudentId:'',
                        scannedBookID:'',
                    })
                }
            })
        }
        return isStudentEligible
    }

    checkBookEligibility = async() => {
        const bookRef = await db.collection("books").where("bookId", "==", this.state.scannedBookID)
        .get();

        var transactionType = "";
        if(bookRef.docs.length==0){
            transactionType=false;
            console.log(bookRef.docs.length)
        } else {
            bookRef.docs.map((doc)=>{
                var book = doc.data();
                if(book.bookAvailability){
                    transactionType="Issue";
                } else {
                    transactionType="Return";
                }
            })
        }
        return transactionType
    }

    checkStudentEligibilityForReturn = async()=>{
        const transactionRef = await db.collection("transactions")
        .where("bookId", "==", this.state.scannedBookID)
        .limit(1).get()
        var isStudentEligible = ""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentId===this.state.scannedStudentID){
                isStudentEligible=true
            } else {
                isStudentEligible=false;
                alert("The Book wasn't Issued by the Student");
                this.setState({
                    scannedBookID:'',
                    scannedStudentID:'',
                })
            }
        })
        return isStudentEligible
    }

    initiateBookIssue = async() => {
        //add a transaction
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentID,
            'bookId':this.state.scannedBookID,
            'data':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"Issue"
        })

        // change book status
        db.collection("books").doc(this.state.scannedBookID).update({
            'bookAvailability':false
        })

        // change number of issued books for student
        db.collection("students").doc(this.state.scannedStudentID).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1),
        })
        alert("Book Issued");
        this.setState({
            scannedStudentID:'',
            scannedBookID:'',
        })
    }

    initiateBookReturn = async() => {
        // add a transaction
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentID,
            'bookId':this.state.scannedBookID,
            'data':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"Return"
        })

        // change book status
        db.collection("books").doc(this.state.scannedBookID).update({
            'bookAvailability':true
        })

        // change book status
        db.collection("students").doc(this.state.scannedStudentID).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1),
        })
        alert("Book Returned");
        this.setState({
            scannedStudentID:'',
            scannedBookID:''
        })
    }
    render(){
        const hasCameraPermissions = this.state.hasCameraPermissions;
        const scanned = this.state.scanned;
        const buttonState = this.state.buttonState;
        if(buttonState!=="normal" && hasCameraPermissions){
            return(
                <BarCodeScanner onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}/>
            )
        } else if(buttonState==="normal"){
        return(
            <KeyboardAvoidingView style={styles.container}
            behavior="padding" enabled>
                <View>
                    <Image
                    source={require('../assets/booklogo.jpg')}
                    style={{width:200, height:200}}/>
                    <Text style={{textAlign:'center', fontSize:30}}>
                        Willy
                    </Text>
                </View>
                <View style={styles.inputView}>
                    <TextInput style={styles.inputBox}
                    placeholder="book ID"
                    onChangeText={(text)=> this.setState({scannedBookID:text})}
                    value={this.state.scannedBookID}/>
                    <TouchableOpacity style={styles.scanButton}
                    onPress={()=>{
                        this.getCameraPermission("BookId");
                    }}>
                        <Text style={styles.buttonText}>
                            Scan
                        </Text>
                    </TouchableOpacity>
                    </View>

                    <View style = {styles.inputView}>
                        <TextInput style={styles.inputBox}
                        placeholder="student ID"
                        onChangeText={(text)=>{this.setState({scannedStudentID:text})}}
                        value={this.state.scannedStudentID}/>
                <TouchableOpacity style={styles.scanButton} 
                onPress={()=>{this.getCameraPermission("StudentId")}}>
                    <Text style={styles.buttonText}>
                        Scan 
                    </Text>
                </TouchableOpacity>

                </View>

                <Text>
                    {this.state.transactionMessage}
                </Text>
                <TouchableOpacity style={styles.submitButton} 
                onPress={async ()=>{
                    var transactionMessage = this.handleTransaction();
                   
                }}>
                    <Text style={styles.submitButtonText}>
                        Submit
                    </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        )
    }
    }
}

const styles = StyleSheet.create({
    submitButton:{
        backgroundColor:'aqua',
        width:100,
        height:50,
    },

    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:1
    },
     container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
     displayText:{ fontSize: 15, textDecorationLine: 'underline' }, 
     scanButton:{ backgroundColor: '#2196F3', padding: 10, margin: 10 }, 
     buttonText:{ fontSize: 15, textAlign: 'center', marginTop: 10 }, 
     inputView:{ flexDirection: 'row', margin: 20 }, 
     inputBox:{ width: 200, height: 40, borderWidth: 1.5, borderRightWidth: 0, fontSize: 20 },
     scanButton:{ backgroundColor: '#66BB6A', width: 50, borderWidth: 1.5, borderLeftWidth: 0 },
     
    });